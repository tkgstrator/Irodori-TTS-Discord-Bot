import { GuildSettingsSchema } from '@irodori-tts/shared/settings'
import { Hono } from 'hono'
import { fetchGuildChannels } from '../discord'
import { getGuildSettings, setGuildSettings } from '../guild-settings'
import { canAccessGuild, listManageableGuilds } from '../guilds'
import { requireSession, type SessionVariables } from '../session'

export const guilds = new Hono<{ Variables: SessionVariables }>()

guilds.use('*', requireSession)

/**
 * ギルド単位の認可
 *
 * 「ユーザーがサーバー管理権限を持つ」かつ「Bot が参加している」ギルド以外は
 * 存在の有無を問わず一律 403 にする。
 */
guilds.use('/:guildId/*', async (c, next) => {
  const allowed = await canAccessGuild(c.get('session'), c.req.param('guildId'))
  if (!allowed) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  await next()
})

/**
 * 設定を変更できるギルド一覧を返す
 */
guilds.get('/', async (c) => c.json(await listManageableGuilds(c.get('session'))))

/**
 * 読み上げ対象に指定できるチャンネル一覧を返す
 */
guilds.get('/:guildId/channels', async (c) => {
  try {
    return c.json(await fetchGuildChannels(c.req.param('guildId')))
  } catch (error) {
    // Bot トークン未設定やDiscord側の失敗をそのまま500にせず、UIで案内できる形にする
    console.error('Failed to fetch guild channels:', error)
    return c.json({ error: 'チャンネル一覧の取得に失敗しました' }, 502)
  }
})

/**
 * ギルド設定を取得する
 */
guilds.get('/:guildId/settings', async (c) => c.json(await getGuildSettings(c.req.param('guildId'))))

/**
 * ギルド設定をまるごと置き換える
 */
guilds.put('/:guildId/settings', async (c) => {
  const parsed = GuildSettingsSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400)
  }

  return c.json(await setGuildSettings(c.req.param('guildId'), parsed.data))
})
