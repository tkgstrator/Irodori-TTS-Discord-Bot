import {
  type SpeakerConfig,
  SpeakerConfigSchema,
  type UserSettings,
  UserSettingsSchema,
  userSettingsKey
} from '@irodori-tts/shared/settings'
import { env } from './env'
import { redis, safeJsonParse, withSerialized } from './redis'

/**
 * デフォルトのユーザー設定を生成する
 *
 * Bot 側と同じ既定値を返す必要があるため `DEFAULT_SPEAKER_ID` は Bot と同値を設定する。
 */
const createDefaultUserSettings = (): UserSettings => ({
  speaker: {
    currentId: env.DEFAULT_SPEAKER_ID,
    settings: {}
  }
})

/**
 * ユーザー設定を取得する
 * @param userId DiscordユーザーID
 * @returns ユーザー設定（未設定や破損時はデフォルト値）
 */
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  const data = await redis.get(userSettingsKey(userId))
  if (data === null) {
    return createDefaultUserSettings()
  }

  const jsonResult = safeJsonParse<unknown>(data)
  if (!jsonResult.ok) {
    console.error(`getUserSettings: JSON parse failed for userId=${userId}`)
    return createDefaultUserSettings()
  }

  const parsed = UserSettingsSchema.safeParse(jsonResult.value)
  if (!parsed.success) {
    // 破損データは消さず、デフォルトを返して調査可能な状態を保つ
    console.error(`getUserSettings: schema validation failed for userId=${userId}`, parsed.error.message)
    return createDefaultUserSettings()
  }

  return parsed.data
}

/**
 * ユーザー設定を保存する
 * @param userId DiscordユーザーID
 * @param settings ユーザー設定
 */
export const setUserSettings = async (userId: string, settings: UserSettings): Promise<UserSettings> => {
  const parsed = UserSettingsSchema.safeParse(settings)
  if (!parsed.success) {
    throw new Error(`Invalid settings: ${parsed.error.message}`)
  }
  await redis.set(userSettingsKey(userId), JSON.stringify(parsed.data))
  return parsed.data
}

/**
 * 現在の話者IDを変更する
 * @param userId DiscordユーザーID
 * @param speakerId 話者UUID
 * @returns 更新後のユーザー設定
 */
export const setCurrentSpeakerId = async (userId: string, speakerId: string): Promise<UserSettings> =>
  withSerialized(userSettingsKey(userId), async () => {
    const settings = await getUserSettings(userId)
    return setUserSettings(userId, {
      speaker: {
        currentId: speakerId,
        settings: settings.speaker.settings
      }
    })
  })

/**
 * 特定の話者の詳細設定を部分更新する
 * @param userId DiscordユーザーID
 * @param speakerId 話者UUID
 * @param config 保存する設定（未指定のフィールドはサーバー側デフォルトに戻る）
 * @returns 保存後の話者設定
 */
export const setSpeakerConfig = async (
  userId: string,
  speakerId: string,
  config: SpeakerConfig
): Promise<SpeakerConfig> =>
  withSerialized(userSettingsKey(userId), async () => {
    const settings = await getUserSettings(userId)

    // フォームは「空欄＝サーバー側デフォルト」を意味するため、
    // 部分マージではなく丸ごと置き換える。
    const parsed = SpeakerConfigSchema.safeParse(config)
    if (!parsed.success) {
      throw new Error(`Invalid speaker config: ${parsed.error.message}`)
    }

    await setUserSettings(userId, {
      speaker: {
        currentId: settings.speaker.currentId,
        settings: { ...settings.speaker.settings, [speakerId]: parsed.data }
      }
    })
    return parsed.data
  })

/**
 * 特定の話者の詳細設定を削除する（サーバー側デフォルトに戻す）
 * @param userId DiscordユーザーID
 * @param speakerId 話者UUID
 * @returns 更新後のユーザー設定
 */
export const clearSpeakerConfig = async (userId: string, speakerId: string): Promise<UserSettings> =>
  withSerialized(userSettingsKey(userId), async () => {
    const settings = await getUserSettings(userId)
    const remaining = Object.fromEntries(Object.entries(settings.speaker.settings).filter(([key]) => key !== speakerId))
    return setUserSettings(userId, {
      speaker: {
        currentId: settings.speaker.currentId,
        settings: remaining
      }
    })
  })
