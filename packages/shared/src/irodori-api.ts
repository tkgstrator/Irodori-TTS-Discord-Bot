import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core'
import { z } from 'zod'

const HealthResponse = z.object({
  status: z.string(),
  speakers: z.number().int().nonnegative()
})

const SpeakerInfo = z.object({
  uuid: z.string(),
  name: z.string(),
  defaults: z.record(z.string(), z.unknown()).optional()
})

const SpeakersResponse = z.object({
  speakers: z.array(SpeakerInfo)
})

const SynthRequest = z.object({
  speaker_id: z.string(),
  text: z.string().min(1),
  seed: z.union([z.number().int(), z.null()]).optional(),
  num_steps: z.union([z.number().int(), z.null()]).optional(),
  cfg_scale_text: z.union([z.number(), z.null()]).optional(),
  cfg_scale_speaker: z.union([z.number(), z.null()]).optional(),
  speaker_kv_scale: z.union([z.number(), z.null()]).optional(),
  truncation_factor: z.union([z.number(), z.null()]).optional()
})

export const schemas = {
  HealthResponse,
  SpeakerInfo,
  SpeakersResponse,
  SynthRequest
}

export type HealthResponse = z.infer<typeof HealthResponse>
export type SpeakerInfo = z.infer<typeof SpeakerInfo>
export type SpeakersResponse = z.infer<typeof SpeakersResponse>
export type SynthRequest = z.infer<typeof SynthRequest>

const endpoints = makeApi([
  {
    method: 'get',
    path: '/health',
    alias: 'health',
    requestFormat: 'json',
    response: HealthResponse
  },
  {
    method: 'get',
    path: '/speakers',
    alias: 'getSpeakers',
    requestFormat: 'json',
    response: SpeakersResponse
  },
  {
    method: 'post',
    path: '/synth',
    alias: 'synth',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: SynthRequest
      }
    ],
    response: z.instanceof(ArrayBuffer),
    responseType: 'blob',
    errors: [
      { status: 404, description: 'speaker_id does not match any loaded LoRA.', schema: z.void() },
      { status: 422, description: 'Validation error.', schema: z.void() },
      { status: 500, description: 'Synthesis failed inside the model runtime.', schema: z.void() },
      { status: 503, description: 'No speakers are loaded.', schema: z.void() }
    ]
  }
])

export { endpoints }

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options)
}
