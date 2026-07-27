import { randomBytes } from 'node:crypto'
import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { env } from './env'
import { redis, safeJsonParse, withSerialized } from './redis'

/**
 * セッションのRedisキープレフィックス
 */
const SESSION_KEY_PREFIX = 'web:session:'

/**
 * OAuth stateのRedisキープレフィックス
 */
const OAUTH_STATE_KEY_PREFIX = 'web:oauth:state:'

/**
 * セッションの有効期限（秒）
 * Discordのアクセストークン有効期間に合わせて7日とする
 */
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

/**
 * OAuth stateの有効期限（秒）
 */
const OAUTH_STATE_TTL_SECONDS = 600

/**
 * ギルド一覧キャッシュの有効期間（ミリ秒）
 * Discordの `/users/@me/guilds` はレート制限が厳しいため必ずキャッシュを挟む
 */
export const GUILD_CACHE_TTL_MS = 5 * 60 * 1000

/**
 * セッションに保持するDiscordユーザー情報
 */
export const SessionUserSchema = z.object({
  id: z.string().nonempty(),
  username: z.string().nonempty(),
  globalName: z.string().nullable(),
  avatar: z.string().nullable()
})

/**
 * セッションに保持するDiscordのトークン情報
 */
const SessionTokensSchema = z.object({
  accessToken: z.string().nonempty(),
  refreshToken: z.string().nonempty(),
  /** アクセストークンの失効時刻（epoch ms） */
  expiresAt: z.number().int()
})

/**
 * セッションに保持するギルド一覧キャッシュ
 */
const SessionGuildCacheSchema = z.object({
  fetchedAt: z.number().int(),
  guilds: z.array(
    z.object({
      id: z.string().nonempty(),
      name: z.string(),
      icon: z.string().nullable(),
      canManage: z.boolean()
    })
  )
})

/**
 * セッションデータのスキーマ
 */
const SessionDataSchema = z.object({
  user: SessionUserSchema,
  tokens: SessionTokensSchema,
  guildsCache: SessionGuildCacheSchema.optional()
})

export type SessionUser = z.infer<typeof SessionUserSchema>
export type SessionTokens = z.infer<typeof SessionTokensSchema>
export type SessionGuildCache = z.infer<typeof SessionGuildCacheSchema>
export type SessionData = z.infer<typeof SessionDataSchema>

/**
 * セッションIDとデータの組
 */
export interface Session {
  id: string
  data: SessionData
}

/**
 * Honoのコンテキスト変数の型
 */
export interface SessionVariables {
  session: Session
}

/**
 * Cookie名を返す
 *
 * 本番（Secure有効）では `__Host-` プレフィックスを使い、
 * ドメイン固定・Path=/・Secure必須の制約をブラウザ側にも強制する。
 */
const cookieName = (): string => (env.COOKIE_SECURE ? '__Host-session' : 'session')

/**
 * セッションIDを生成する
 */
const createSessionId = (): string => randomBytes(32).toString('hex')

/**
 * セッションのRedisキーを生成する
 */
const sessionKey = (sessionId: string): string => `${SESSION_KEY_PREFIX}${sessionId}`

/**
 * OAuth stateを発行してRedisに保存する
 * @returns 生成したstate
 */
export const issueOAuthState = async (): Promise<string> => {
  const state = randomBytes(16).toString('hex')
  await redis.set(`${OAUTH_STATE_KEY_PREFIX}${state}`, '1', 'EX', OAUTH_STATE_TTL_SECONDS)
  return state
}

/**
 * OAuth stateを検証して破棄する
 * @param state コールバックで受け取ったstate
 * @returns 有効なstateだったか
 */
export const consumeOAuthState = async (state: string): Promise<boolean> => {
  const removed = await redis.del(`${OAUTH_STATE_KEY_PREFIX}${state}`)
  return removed === 1
}

/**
 * セッションを作成してCookieを発行する
 * @param c Honoのコンテキスト
 * @param data セッションデータ
 */
export const createSession = async (c: Context, data: SessionData): Promise<string> => {
  const sessionId = createSessionId()
  await redis.set(sessionKey(sessionId), JSON.stringify(data), 'EX', SESSION_TTL_SECONDS)

  setCookie(c, cookieName(), sessionId, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  })

  return sessionId
}

/**
 * セッションデータを更新する（TTLは維持する）
 * @param sessionId セッションID
 * @param data 新しいセッションデータ
 */
export const updateSession = async (sessionId: string, data: SessionData): Promise<void> => {
  await redis.set(sessionKey(sessionId), JSON.stringify(data), 'KEEPTTL')
}

/**
 * セッションを破棄してCookieを削除する
 * @param c Honoのコンテキスト
 * @param sessionId セッションID
 */
export const destroySession = async (c: Context, sessionId: string): Promise<void> => {
  await redis.del(sessionKey(sessionId))
  deleteCookie(c, cookieName(), { path: '/' })
}

/**
 * リクエストからセッションを復元する
 * @param c Honoのコンテキスト
 * @returns セッション（未ログインや破損時はnull）
 */
export const getSession = async (c: Context): Promise<Session | null> => {
  const sessionId = getCookie(c, cookieName())
  if (sessionId === undefined || sessionId.length === 0) {
    return null
  }

  const raw = await redis.get(sessionKey(sessionId))
  if (raw === null) {
    return null
  }

  const jsonResult = safeJsonParse<unknown>(raw)
  if (!jsonResult.ok) {
    await redis.del(sessionKey(sessionId))
    return null
  }

  const parsed = SessionDataSchema.safeParse(jsonResult.value)
  if (!parsed.success) {
    await redis.del(sessionKey(sessionId))
    return null
  }

  return { id: sessionId, data: parsed.data }
}

/**
 * セッション単位で処理を直列化する
 *
 * Discordのトークンリフレッシュは並行実行すると相互に無効化されるため、
 * リフレッシュ処理は必ずこのヘルパを通す。
 * @param sessionId セッションID
 * @param fn 直列に実行したい処理
 */
export const withSessionLock = async <T>(sessionId: string, fn: () => Promise<T>): Promise<T> =>
  withSerialized(sessionKey(sessionId), fn)

/**
 * ログイン必須のルートに適用するミドルウェア
 */
export const requireSession: MiddlewareHandler<{ Variables: SessionVariables }> = async (c, next) => {
  const session = await getSession(c)
  if (session === null) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('session', session)
  await next()
}
