import type { IrodoriOptions } from '@irodori-tts/shared/irodori-api'
import type { SpeakerConfig } from '@irodori-tts/shared/settings'
import { config } from '../config'
import { createSpeechRequest, parseWav } from './tts-response'

export interface PcmAudio {
  buffer: Buffer
  sampleRate: number
  /** ログ・通知用のメタ情報。キューの挙動には一切影響しない */
  authorId?: string
  /** ログ・通知用のメタ情報。キューの挙動には一切影響しない */
  lineIndex?: number
}

export const synthesize = async (text: string, speakerId: string, params: IrodoriOptions = {}): Promise<PcmAudio> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'audio/wav' }
  if (config.IRODORI_TTS_API_KEY !== undefined) {
    headers.Authorization = `Bearer ${config.IRODORI_TTS_API_KEY}`
  }

  const response = await fetch(`${config.IRODORI_TTS_BASE_URL}/audio/speech`, {
    method: 'POST',
    headers,
    body: JSON.stringify(createSpeechRequest(text, speakerId, config.IRODORI_TTS_MODEL, params))
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`TTS synthesis failed: ${response.status} ${response.statusText} ${detail}`)
  }

  return parseWav(Buffer.from(await response.arrayBuffer()))
}

const toSynthParams = (cfg: SpeakerConfig): IrodoriOptions => ({
  seed: cfg.seed,
  num_steps: cfg.numSteps,
  cfg_scale_text: cfg.cfgScaleText,
  cfg_scale_speaker: cfg.cfgScaleSpeaker,
  speaker_kv_scale: cfg.speakerKvScale,
  truncation_factor: cfg.truncationFactor
})

export const textToSpeechWithSettings = async (
  text: string,
  speakerId: string,
  speakerConfig: SpeakerConfig,
  meta?: { authorId?: string; lineIndex?: number }
): Promise<PcmAudio> => {
  console.debug('TTS request:', { text, speakerId })
  const audio = await synthesize(text, speakerId, toSynthParams(speakerConfig))
  return { ...audio, ...meta }
}
