import { BOT_GUILDS_KEY } from '@irodori-tts/shared/settings'
import { isDevAuthBypassEnabled } from './dev-auth'
import { canManageGuild, fetchBotGuilds, fetchUserGuilds, needsRefresh, refreshTokens } from './discord'
import { redis } from './redis'
import {
  GUILD_CACHE_TTL_MS,
  type Session,
  type SessionData,
  type SessionGuildCache,
  updateSession,
  withSessionLock
} from './session'

/**
 * 画面に出すギルド1件
 */
export type GuildSummary = SessionGuildCache['guilds'][number]

/**
 * アクセストークンが失効間近ならリフレッシュし、最新のセッションデータを返す
 *
 * リフレッシュは並行実行すると相互に無効化されるため必ずセッションロックを通す。
 * @param session 現在のセッション
 */
const ensureFreshSession = async (session: Session): Promise<SessionData> => {
  if (!needsRefresh(session.data.tokens)) {
    return session.data
  }

  return withSessionLock(session.id, async () => {
    const tokens = await refreshTokens(session.data.tokens.refreshToken)
    const next: SessionData = { ...session.data, tokens }
    await updateSession(session.id, next)
    return next
  })
}

/**
 * ログイン中ユーザーの所属ギルド一覧を取得する
 *
 * `/users/@me/guilds` はレート制限が厳しいため、セッションに TTL 付きでキャッシュする。
 * @param session 現在のセッション
 */
const loadUserGuilds = async (session: Session): Promise<GuildSummary[]> => {
  const cached = session.data.guildsCache
  if (cached !== undefined && Date.now() - cached.fetchedAt < GUILD_CACHE_TTL_MS) {
    return cached.guilds
  }

  const data = await ensureFreshSession(session)
  const guilds = await fetchUserGuilds(data.tokens.accessToken)
  const summaries = guilds.map((guild) => ({
    id: guild.id,
    name: guild.name,
    icon: guild.icon ?? null,
    canManage: canManageGuild(guild)
  }))

  await updateSession(session.id, { ...data, guildsCache: { fetchedAt: Date.now(), guilds: summaries } })
  return summaries
}

/**
 * dev バイパス時のギルド一覧キャッシュ
 *
 * 擬似セッションはRedisに保存されずセッションキャッシュを使えないため、
 * プロセス内に持つ。無いとリクエストごとにDiscordを叩いて429になる。
 */
const devGuildCache = new Map<'entry', { fetchedAt: number; guilds: GuildSummary[] }>()

/**
 * 開発用ログインバイパス時のギルド一覧
 *
 * 擬似セッションはDiscordのトークンを持たないため、代わりに Bot トークンで
 * Bot 自身の参加ギルドを引き、すべて管理可能として扱う。
 * Bot トークンも無い環境では `bot:guilds` のIDだけで一覧を組み立て、
 * 資格情報ゼロでも画面を触れるようにする。
 */
const loadDevGuilds = async (botGuildIds: Set<string>): Promise<GuildSummary[]> => {
  const cached = devGuildCache.get('entry')
  if (cached !== undefined && Date.now() - cached.fetchedAt < GUILD_CACHE_TTL_MS) {
    return cached.guilds
  }

  const guilds = await fetchBotGuilds().catch((error: unknown) => {
    console.warn('[dev-auth] Bot トークンでギルド名を解決できないため、IDのみで一覧を返します', error)
    return [...botGuildIds].map((id) => ({ id, name: id, icon: null }))
  })

  const summaries = guilds.map((guild) => ({
    id: guild.id,
    name: guild.name,
    icon: guild.icon ?? null,
    canManage: true
  }))

  devGuildCache.set('entry', { fetchedAt: Date.now(), guilds: summaries })
  return summaries
}

/**
 * Bot が参加しているギルドIDの集合を取得する
 *
 * Bot 側が起動時とギルド参加・退出のたびに `bot:guilds` を更新している。
 */
const loadBotGuildIds = async (): Promise<Set<string>> => new Set(await redis.smembers(BOT_GUILDS_KEY))

/**
 * ログイン中ユーザーが設定を変更できるギルド一覧を返す
 *
 * 「ユーザーがサーバー管理権限を持つ」かつ「Bot が参加している」ギルドだけを通す。
 * @param session 現在のセッション
 */
export const listManageableGuilds = async (session: Session): Promise<GuildSummary[]> => {
  // dev バイパスのフォールバックが `bot:guilds` を必要とするため先に引く
  const botGuildIds = await loadBotGuildIds()
  const guilds = isDevAuthBypassEnabled() ? await loadDevGuilds(botGuildIds) : await loadUserGuilds(session)

  return guilds.filter((guild) => guild.canManage && botGuildIds.has(guild.id))
}

/**
 * 指定ギルドの設定を変更できるかを判定する
 * @param session 現在のセッション
 * @param guildId ギルドID
 */
export const canAccessGuild = async (session: Session, guildId: string): Promise<boolean> => {
  const guilds = await listManageableGuilds(session)
  return guilds.some((guild) => guild.id === guildId)
}
