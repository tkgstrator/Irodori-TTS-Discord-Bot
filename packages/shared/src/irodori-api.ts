// このファイルは Irodori-TTS-Server の OpenAPI を基にしています。
import { makeApi, Zodios, type ZodiosOptions } from '@qtmleap/zodios'
import { z } from 'zod'

const Model = z.object({ id: z.string().nonempty(), object: z.literal('model'), owned_by: z.string() }).passthrough()
const ModelsResponse = z.object({ object: z.literal('list'), data: z.array(Model) }).passthrough()
const VoiceDefaults = z.record(z.string(), z.unknown())
const Voice = z
  .object({
    id: z.string().nonempty(),
    object: z.literal('voice'),
    name: z.string().nonempty(),
    cv: z.string().nullable().optional(),
    category: z
      .object({
        id: z.string().nullable().optional(),
        label: z.string().nullable().optional()
      })
      .nullable()
      .optional(),
    defaults: VoiceDefaults.optional()
  })
  .passthrough()
const VoicesResponse = z.object({ object: z.literal('list'), data: z.array(Voice) }).passthrough()
const IrodoriOptions = z
  .object({
    caption: z.string().optional(),
    seed: z.number().int().nullable().optional(),
    num_steps: z.number().int().nullable().optional(),
    cfg_scale_text: z.number().nullable().optional(),
    cfg_scale_speaker: z.number().nullable().optional(),
    speaker_kv_scale: z.number().nullable().optional(),
    truncation_factor: z.number().nullable().optional()
  })
  .passthrough()
const SpeechRequest = z
  .object({
    model: z.string().nonempty(),
    input: z.string().min(1).max(4096),
    voice: z.union([z.string().nonempty(), z.object({ id: z.string().nonempty() })]).optional(),
    response_format: z.enum(['wav', 'mp3', 'flac', 'opus', 'aac', 'pcm']).optional(),
    speed: z.number().min(0.25).max(4).optional(),
    irodori: IrodoriOptions.optional()
  })
  .passthrough()

export const schemas = { Model, ModelsResponse, VoiceDefaults, Voice, VoicesResponse, IrodoriOptions, SpeechRequest }

export type Model = z.infer<typeof Model>
export type ModelsResponse = z.infer<typeof ModelsResponse>
export type VoiceDefaults = z.infer<typeof VoiceDefaults>
export type Voice = z.infer<typeof Voice>
export type VoicesResponse = z.infer<typeof VoicesResponse>
export type IrodoriOptions = z.infer<typeof IrodoriOptions>
export type SpeechRequest = z.infer<typeof SpeechRequest>

const endpoints = makeApi([
  {
    method: 'get',
    path: '/models',
    alias: 'listModels',
    requestFormat: 'json',
    response: ModelsResponse
  },
  {
    method: 'get',
    path: '/audio/voices',
    alias: 'listVoices',
    requestFormat: 'json',
    response: VoicesResponse
  },
  {
    method: 'post',
    path: '/audio/speech',
    alias: 'createSpeech',
    requestFormat: 'json',
    parameters: [{ name: 'body', type: 'Body', schema: SpeechRequest }],
    response: z.instanceof(ArrayBuffer)
  }
])

export const api = new Zodios(endpoints)

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options)
}
