import {
  type SpeakerConfig,
  type UserSettings,
  UserSettingsSchema,
  userSettingsKey
} from '@irodori-tts/shared/settings'
import Redis from 'ioredis'
import { config } from '../config'
import { notifyError } from './notifier'

/**
 * Redisクライアント
 */
export const redis = new Redis(config.REDIS_URL)

/**
 * キー単位でRead-Modify-Write処理を直列化するためのin-flightキュー
 * 同一キーへの並行更新でロスト・アップデートが起きるのを防ぐ
 */
const inFlight = new Map<string, Promise<unknown>>()

/**
 * 指定キーに紐づく処理を直列化して実行する
 * 単一プロセス内でのget→mutate→setをアトミックに見せかけるためのヘルパ
 * @param key 直列化の単位となるキー（Redisキーをそのまま利用する）
 * @param fn 直列に実行したい処理
 * @returns fnの返り値
 */
export const withSerialized = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
  const prev = inFlight.get(key) ?? Promise.resolve()
  const next = prev.then(fn, fn)
  inFlight.set(key, next)
  try {
    return await next
  } finally {
    if (inFlight.get(key) === next) inFlight.delete(key)
  }
}

/**
 * JSON.parseの結果を表す型
 */
type JsonParseResult<T> = { ok: true; value: T } | { ok: false }

/**
 * JSON.parseを例外を投げずに実行する
 * @param data パース対象の文字列
 * @returns パース結果
 */
export const safeJsonParse = <T>(data: string): JsonParseResult<T> => {
  try {
    return { ok: true, value: JSON.parse(data) as T }
  } catch {
    return { ok: false }
  }
}

/**
 * デフォルトの話者設定を生成する
 *
 * Irodori-TTS では各LoRAにサンプリングデフォルトが埋め込まれているため、
 * ユーザー側の初期値は空（＝サーバー側のLoRAデフォルトに委ねる）とする。
 */
const createDefaultSpeakerConfig = (): SpeakerConfig => ({})

/**
 * デフォルトのユーザー設定を生成する
 * @returns デフォルト設定
 */
const createDefaultUserSettings = (): UserSettings => ({
  speaker: {
    currentId: config.DEFAULT_SPEAKER_ID,
    settings: {}
  }
})

/**
 * ユーザー設定を取得する
 * @param userId DiscordユーザーID
 * @returns ユーザー設定（未設定の場合はデフォルト値）
 */
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  const data = await redis.get(userSettingsKey(userId))
  if (data === null) {
    return createDefaultUserSettings()
  }

  const jsonResult = safeJsonParse<unknown>(data)
  if (!jsonResult.ok) {
    await notifyError('getUserSettings: JSON parse failed', new Error(`Failed to parse JSON for userId=${userId}`), {
      userId
    })
    return createDefaultUserSettings()
  }

  const parseResult = UserSettingsSchema.safeParse(jsonResult.value)
  if (!parseResult.success) {
    // パース失敗時は既存データを削除せず、デフォルト値を返して調査可能な状態を保つ
    await notifyError('getUserSettings: schema validation failed', parseResult.error, {
      userId
    })
    return createDefaultUserSettings()
  }

  return parseResult.data
}

/**
 * 現在の話者IDを取得する
 * @param userId DiscordユーザーID
 * @returns 現在の話者UUID
 */
export const getCurrentSpeakerId = async (userId: string): Promise<string> => {
  const settings = await getUserSettings(userId)
  return settings.speaker.currentId
}

/**
 * 特定の話者の設定を取得する
 * @param userId DiscordユーザーID
 * @param speakerId 話者UUID
 * @returns 話者設定（未設定の場合はデフォルト値）
 */
export const getSpeakerConfig = async (userId: string, speakerId: string): Promise<SpeakerConfig> => {
  const settings = await getUserSettings(userId)
  return settings.speaker.settings[speakerId] ?? createDefaultSpeakerConfig()
}

/**
 * 現在の話者の設定を取得する
 * @param userId DiscordユーザーID
 * @returns 現在の話者設定
 */
export const getCurrentSpeakerConfig = async (userId: string): Promise<SpeakerConfig> => {
  const settings = await getUserSettings(userId)
  return getSpeakerConfig(userId, settings.speaker.currentId)
}

/**
 * 現在の話者IDと話者設定をまとめて取得する
 * ユーザー設定の読み込みを1回にまとめ、getCurrentSpeakerId + getCurrentSpeakerConfig の
 * 二重Redis読み出しを避ける
 * @param userId DiscordユーザーID
 * @returns 現在の話者IDと話者設定
 */
export const getCurrentSpeakerContext = async (
  userId: string
): Promise<{ speakerId: string; config: SpeakerConfig }> => {
  const settings = await getUserSettings(userId)
  const speakerId = settings.speaker.currentId
  const config = settings.speaker.settings[speakerId] ?? createDefaultSpeakerConfig()
  return { speakerId, config }
}

/**
 * Redisへの接続確認
 */
export const pingRedis = async (): Promise<boolean> => {
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch {
    return false
  }
}
