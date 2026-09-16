import { createApiClient } from '@irodori-tts/shared/irodori-api'
import type { Speaker, SpeakerDefaults } from '../schemas/settings-api.dto'
import { env } from './env'

/**
 * Irodori-TTS クライアントのキャッシュ
 */
const cache = new Map<string, ReturnType<typeof createApiClient>>()

/**
 * Irodori-TTS クライアントを取得する
 */
const loadClient = (): ReturnType<typeof createApiClient> => {
  const cached = cache.get('client')
  if (cached !== undefined) {
    return cached
  }

  const headers = env.IRODORI_TTS_API_KEY ? { Authorization: `Bearer ${env.IRODORI_TTS_API_KEY}` } : undefined
  const client = createApiClient(env.IRODORI_TTS_BASE_URL, { fetchOptions: { headers } })
  cache.set('client', client)
  return client
}

const toSpeakerDefaults = (defaults: Record<string, unknown> | undefined): SpeakerDefaults => {
  const source = defaults ?? {}
  const pick = (key: string): number | undefined => {
    const value = source[key]
    return typeof value === 'number' ? value : undefined
  }

  return {
    numSteps: pick('num_steps'),
    cfgScaleText: pick('cfg_scale_text'),
    cfgScaleSpeaker: pick('cfg_scale_speaker'),
    speakerKvScale: pick('speaker_kv_scale'),
    truncationFactor: pick('truncation_factor'),
    seed: pick('seed')
  }
}

/**
 * 話者一覧を取得し、UI が必要とする項目だけに整形する
 */
export const getSpeakers = async (): Promise<Speaker[]> => {
  const response = await loadClient().listVoices()
  return response.data.map((voice) => ({
    uuid: voice.id,
    name: voice.name,
    cv: voice.cv ?? null,
    categoryLabel: voice.category?.label ?? null,
    defaults: toSpeakerDefaults(voice.defaults)
  }))
}

/**
 * 話者未設定ユーザーに割り当てる話者IDを解決する
 *
 * `DEFAULT_SPEAKER_ID` が設定されていればそれを使う（Bot と同じ値にすること）。
 * 未設定なら Irodori-TTS の先頭の話者にフォールバックし、環境変数なしでも
 * ローカル開発が始められるようにする。
 */
export const resolveDefaultSpeakerId = async (): Promise<string> => {
  const configured = env.DEFAULT_SPEAKER_ID
  if (configured !== undefined && configured.length > 0) {
    return configured
  }

  const speakers = await getSpeakers()
  const first = speakers[0]
  if (first === undefined) {
    throw new Error('No speakers available from Irodori-TTS. Set DEFAULT_SPEAKER_ID explicitly.')
  }

  return first.uuid
}
