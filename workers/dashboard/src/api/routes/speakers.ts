import { createApiClient } from '@irodori-tts/shared/irodori-api'
import { Hono } from 'hono'
import { env } from '../env'
import { requireSession, type SessionVariables } from '../session'

export const speakers = new Hono<{ Variables: SessionVariables }>()

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
 * 話者一覧を返す
 *
 * ダッシュボードはDBを持たないため、Irodori-TTS サーバーから都度取得して
 * UI が必要とする項目だけに整形する。
 */
speakers.get('/', requireSession, async (c) => {
  const response = await loadClient().list_speakers_speakers_get()
  return c.json(
    response.speakers.map((speaker) => ({
      uuid: speaker.uuid,
      name: speaker.name,
      cv: speaker.cv ?? null,
      categoryLabel: speaker.category.label ?? null
    }))
  )
})
