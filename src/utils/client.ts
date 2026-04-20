import { Zodios } from '@zodios/core'
import { z } from 'zod'
import { HealthResponseSchema, SpeakersResponseSchema, SynthRequestSchema } from '../schemas/irodori.dto'

/**
 * Irodori-TTS APIのベースURL
 */
const IRODORI_TTS_BASE_URL = process.env.IRODORI_TTS_BASE_URL ?? 'http://irodori-tts:8765'

/**
 * Irodori-TTS APIクライアント
 *
 * `POST /synth` に `speaker_id` と `text` を渡すと直接 `audio/wav` を返す。
 */
export const irodoriClient = new Zodios(IRODORI_TTS_BASE_URL, [
  {
    method: 'get',
    path: '/health',
    alias: 'health',
    description: '疎通確認',
    response: HealthResponseSchema
  },
  {
    method: 'get',
    path: '/speakers',
    alias: 'getSpeakers',
    description: '登録済み話者の一覧を取得する',
    response: SpeakersResponseSchema
  },
  {
    method: 'post',
    path: '/synth',
    alias: 'synth',
    description: '指定話者でテキストを音声合成し、WAVを返す',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: SynthRequestSchema
      }
    ],
    // WAVバイナリを返すため、ArrayBufferとして受け取る
    response: z.instanceof(ArrayBuffer),
    responseType: 'blob'
  }
])

export type IrodoriClient = typeof irodoriClient
