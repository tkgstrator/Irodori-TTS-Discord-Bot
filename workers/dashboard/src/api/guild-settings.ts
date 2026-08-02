import { type GuildSettings, GuildSettingsSchema, guildSettingsKey } from '@irodori-tts/shared/settings'
import { redis, safeJsonParse, withSerialized } from './redis'

/**
 * デフォルトのギルド設定
 *
 * Bot 側（`workers/bot/src/utils/guild-settings.ts`）と同じ既定値を返す必要がある。
 */
const createDefaultGuildSettings = (): GuildSettings => ({
  readNonVcUsers: true,
  announceJoin: true,
  announceLeave: true,
  readChannels: []
})

/**
 * ギルド設定を取得する
 * @param guildId ギルドID
 * @returns ギルド設定（未設定や破損時はデフォルト値）
 */
export const getGuildSettings = async (guildId: string): Promise<GuildSettings> => {
  const data = await redis.get(guildSettingsKey(guildId))
  if (data === null) {
    return createDefaultGuildSettings()
  }

  const jsonResult = safeJsonParse<unknown>(data)
  if (!jsonResult.ok) {
    console.error(`getGuildSettings: JSON parse failed for guildId=${guildId}`)
    return createDefaultGuildSettings()
  }

  const parsed = GuildSettingsSchema.safeParse(jsonResult.value)
  if (!parsed.success) {
    // 破損データは消さず、デフォルトを返して調査可能な状態を保つ
    console.error(`getGuildSettings: schema validation failed for guildId=${guildId}`, parsed.error.message)
    return createDefaultGuildSettings()
  }

  return parsed.data
}

/**
 * ギルド設定を保存する
 *
 * 画面はフォーム全体を送るため部分マージせず丸ごと置き換える。
 * @param guildId ギルドID
 * @param settings ギルド設定
 * @returns 保存後のギルド設定
 */
export const setGuildSettings = async (guildId: string, settings: GuildSettings): Promise<GuildSettings> =>
  withSerialized(guildSettingsKey(guildId), async () => {
    const parsed = GuildSettingsSchema.safeParse(settings)
    if (!parsed.success) {
      throw new Error(`Invalid guild settings: ${parsed.error.message}`)
    }

    await redis.set(guildSettingsKey(guildId), JSON.stringify(parsed.data))
    return parsed.data
  })
