import { createApiClient } from '@irodori-tts/shared/irodori-api'

export const IRODORI_TTS_BASE_URL = process.env.IRODORI_TTS_BASE_URL ?? 'http://irodori-tts:8765'

export const irodoriClient = createApiClient(IRODORI_TTS_BASE_URL)

export type IrodoriClient = typeof irodoriClient
