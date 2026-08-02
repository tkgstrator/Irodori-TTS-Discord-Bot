import { type GuildSettings, GuildSettingsSchema, guildSettingsKey } from '@irodori-tts/shared/settings'
import { notifyError } from './notifier'
import { redis, safeJsonParse } from './redis'

/**
 * デフォルトのギルド設定
 */
const defaultGuildSettings: GuildSettings = {
  readNonVcUsers: true,
  announceJoin: true,
  announceLeave: true,
  readChannels: []
}

/**
 * ギルド設定を取得する
 * @param guildId - ギルドID
 * @returns ギルド設定
 */
export const getGuildSettings = async (guildId: string): Promise<GuildSettings> => {
  const key = guildSettingsKey(guildId)
  const data = await redis.get(key)

  if (!data) {
    return defaultGuildSettings
  }

  const jsonResult = safeJsonParse<unknown>(data)
  if (!jsonResult.ok) {
    await notifyError('getGuildSettings: JSON parse failed', new Error(`Failed to parse JSON for guildId=${guildId}`), {
      guildId
    })
    return defaultGuildSettings
  }

  const parsed = GuildSettingsSchema.safeParse(jsonResult.value)
  if (!parsed.success) {
    await notifyError('getGuildSettings: schema validation failed', parsed.error, {
      guildId
    })
    return defaultGuildSettings
  }

  return parsed.data
}
