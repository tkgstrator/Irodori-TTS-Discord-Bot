import { createApiClient } from '@irodori-tts/shared/irodori-api'
import type { Speaker } from '../schemas/settings-api.dto'
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

  const client = createApiClient(env.IRODORI_TTS_BASE_URL)
  cache.set('client', client)
  return client
}

/**
 * 話者一覧を取得し、UI が必要とする項目だけに整形する
 *
 * ダッシュボードはDBを持たないため、都度 Irodori-TTS サーバーから取得する。
 */
export const getSpeakers = async (): Promise<Speaker[]> => {
  const response = await loadClient().list_speakers_speakers_get()
  return response.speakers.map((speaker) => ({
    uuid: speaker.uuid,
    name: speaker.name,
    cv: speaker.cv ?? null,
    categoryLabel: speaker.category.label ?? null
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
