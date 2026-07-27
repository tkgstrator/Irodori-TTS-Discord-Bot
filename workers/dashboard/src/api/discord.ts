import { z } from 'zod'
import { env } from './env'
import type { SessionTokens } from './session'

/**
 * Discord API のベースURL
 */
const DISCORD_API_BASE = 'https://discord.com/api/v10'

/**
 * OAuth で要求するスコープ
 * identify: ユーザー情報 / guilds: 所属ギルドと権限ビットフィールド
 */
const OAUTH_SCOPES = 'identify guilds'

/**
 * アクセストークンの残り寿命がこれを下回ったらリフレッシュする（ミリ秒）
 */
const REFRESH_THRESHOLD_MS = 60 * 1000

/**
 * トークンエンドポイントのレスポンス
 */
const TokenResponseSchema = z.object({
  access_token: z.string().nonempty(),
  refresh_token: z.string().nonempty(),
  expires_in: z.number().int()
})

/**
 * `/users/@me` のレスポンス
 */
const DiscordUserSchema = z.object({
  id: z.string().nonempty(),
  username: z.string(),
  global_name: z.string().nullish(),
  avatar: z.string().nullish()
})

/**
 * `/users/@me/guilds` の1要素
 */
const DiscordGuildSchema = z.object({
  id: z.string().nonempty(),
  name: z.string(),
  icon: z.string().nullish(),
  owner: z.boolean().optional(),
  permissions: z.string().optional()
})

export type DiscordUser = z.infer<typeof DiscordUserSchema>
export type DiscordGuild = z.infer<typeof DiscordGuildSchema>

/**
 * ManageGuild 権限のビット（1 << 5）
 */
const MANAGE_GUILD_FLAG = 0x20n

/**
 * 認可URLを組み立てる
 * @param state CSRF対策のstate
 */
export const buildAuthorizeUrl = (state: string): string => {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: OAUTH_SCOPES,
    state,
    prompt: 'none'
  })
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}

/**
 * トークンエンドポイントを叩く
 * @param body 送信するフォームパラメータ
 */
const requestToken = async (body: Record<string, string>): Promise<SessionTokens> => {
  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      ...body
    })
  })

  if (!response.ok) {
    throw new Error(`Discord token request failed: ${response.status}`)
  }

  const parsed = TokenResponseSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new Error(`Unexpected token response: ${parsed.error.message}`)
  }

  return {
    accessToken: parsed.data.access_token,
    refreshToken: parsed.data.refresh_token,
    expiresAt: Date.now() + parsed.data.expires_in * 1000
  }
}

/**
 * 認可コードをトークンに交換する
 * @param code コールバックで受け取った認可コード
 */
export const exchangeCode = async (code: string): Promise<SessionTokens> =>
  requestToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.OAUTH_REDIRECT_URI
  })

/**
 * リフレッシュトークンでアクセストークンを更新する
 * @param refreshToken リフレッシュトークン
 */
export const refreshTokens = async (refreshToken: string): Promise<SessionTokens> =>
  requestToken({
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })

/**
 * トークンが失効間近かどうかを判定する
 * @param tokens 現在のトークン
 */
export const needsRefresh = (tokens: SessionTokens): boolean => tokens.expiresAt - Date.now() < REFRESH_THRESHOLD_MS

/**
 * Discord API を認証付きで叩く
 * @param path APIパス
 * @param accessToken アクセストークン
 */
const fetchWithToken = async (path: string, accessToken: string): Promise<unknown> => {
  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    throw new Error(`Discord API ${path} failed: ${response.status}`)
  }

  return response.json()
}

/**
 * ログイン中ユーザーの情報を取得する
 * @param accessToken アクセストークン
 */
export const fetchCurrentUser = async (accessToken: string): Promise<DiscordUser> => {
  const parsed = DiscordUserSchema.safeParse(await fetchWithToken('/users/@me', accessToken))
  if (!parsed.success) {
    throw new Error(`Unexpected user response: ${parsed.error.message}`)
  }
  return parsed.data
}

/**
 * ログイン中ユーザーの所属ギルド一覧を取得する
 *
 * このエンドポイントはレート制限が厳しいため、呼び出し側で必ずキャッシュする。
 * @param accessToken アクセストークン
 */
export const fetchUserGuilds = async (accessToken: string): Promise<DiscordGuild[]> => {
  const parsed = z.array(DiscordGuildSchema).safeParse(await fetchWithToken('/users/@me/guilds', accessToken))
  if (!parsed.success) {
    throw new Error(`Unexpected guilds response: ${parsed.error.message}`)
  }
  return parsed.data
}

/**
 * ギルドを管理できる権限を持つか判定する
 * @param guild ギルド情報
 */
export const canManageGuild = (guild: DiscordGuild): boolean => {
  if (guild.owner === true) {
    return true
  }
  if (guild.permissions === undefined) {
    return false
  }

  const parsed = BigInt(guild.permissions)
  return (parsed & MANAGE_GUILD_FLAG) === MANAGE_GUILD_FLAG
}
