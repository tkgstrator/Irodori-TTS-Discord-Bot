// このファイルは OpenAPI から生成したクライアントをベースにしています。
import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core'
import { z } from 'zod'

const HealthResponse = z.object({ status: z.string(), speakers: z.number().int().gte(0) }).passthrough()
const SpeakerInfo = z
  .object({
    uuid: z.string(),
    name: z.string(),
    defaults: z.object({}).partial().passthrough().optional()
  })
  .passthrough()
const SpeakersResponse = z.object({ speakers: z.array(SpeakerInfo) }).passthrough()
const SynthRequest = z
  .object({
    speaker_id: z.string(),
    text: z.string().min(1),
    seed: z.union([z.number(), z.null()]).optional(),
    num_steps: z.union([z.number(), z.null()]).optional(),
    cfg_scale_text: z.union([z.number(), z.null()]).optional(),
    cfg_scale_speaker: z.union([z.number(), z.null()]).optional(),
    speaker_kv_scale: z.union([z.number(), z.null()]).optional(),
    truncation_factor: z.union([z.number(), z.null()]).optional()
  })
  .passthrough()

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
    alias: 'health_health_get',
    description: `Returns &#x60;&#x60;{status: &#x27;ok&#x27;, speakers: &lt;count&gt;}&#x60;&#x60; once the process is up. Cheap — does not touch the GPU — safe to poll from load balancers or Discord bot health checks.`,
    requestFormat: 'json',
    response: HealthResponse
  },
  {
    method: 'get',
    path: '/speakers',
    alias: 'list_speakers_speakers_get',
    description: `Returns every LoRA adapter discovered under &#x60;&#x60;lora_dir&#x60;&#x60; at startup, along with its stable UUID and the sampling defaults baked into the LoRA metadata. Clients should cache this list and re-fetch only when the server is restarted — new &#x60;&#x60;.safetensors&#x60;&#x60; files are **not** picked up at runtime.`,
    requestFormat: 'json',
    response: SpeakersResponse
  },
  {
    method: 'post',
    path: '/synth',
    alias: 'synth_synth_post',
    description: `Runs text-to-speech for &#x60;&#x60;speaker_id&#x60;&#x60; and streams the result as a WAV body. All sampling knobs are optional — omit them to get the speaker&#x27;s trained defaults. The endpoint is synchronous and can take several seconds per request depending on &#x60;&#x60;num_steps&#x60;&#x60; and GPU load; callers should set a generous HTTP timeout (30–60s is typical).`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: SynthRequest
      }
    ],
    response: z.instanceof(ArrayBuffer),
    errors: [
      {
        status: 404,
        description: `&#x60;&#x60;speaker_id&#x60;&#x60; does not match any loaded LoRA.`,
        schema: z.void()
      },
      {
        status: 422,
        description: `Validation error (e.g. missing &#x60;&#x60;text&#x60;&#x60; or &#x60;&#x60;speaker_id&#x60;&#x60;).`,
        schema: z.void()
      },
      {
        status: 500,
        description: `Synthesis failed inside the model runtime.`,
        schema: z.void()
      },
      {
        status: 503,
        description: `No speakers are loaded. The server started without any LoRA under &#x60;&#x60;lora_dir&#x60;&#x60;; add one and restart.`,
        schema: z.void()
      }
    ]
  }
])

export const api = new Zodios(endpoints)

export const createApiClient = (baseUrl: string, options?: ZodiosOptions) => {
  return new Zodios(baseUrl, endpoints, options)
}
