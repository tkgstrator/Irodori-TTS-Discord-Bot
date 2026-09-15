import { createApiClient } from '@irodori-tts/shared/irodori-api'
import { config } from '../config'

const headers = config.IRODORI_TTS_API_KEY ? { Authorization: `Bearer ${config.IRODORI_TTS_API_KEY}` } : undefined

export const irodoriClient = createApiClient(config.IRODORI_TTS_BASE_URL, { fetchOptions: { headers } })

export type IrodoriClient = typeof irodoriClient
