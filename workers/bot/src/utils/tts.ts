import type { IrodoriOptions, SpeechRequest } from '@irodori-tts/shared/irodori-api'
import type { SpeakerConfig } from '@irodori-tts/shared/settings'
import { config } from '../config'

export interface PcmAudio {
  buffer: Buffer
  sampleRate: number
  /** ログ・通知用のメタ情報。キューの挙動には一切影響しない */
  authorId?: string
  /** ログ・通知用のメタ情報。キューの挙動には一切影響しない */
  lineIndex?: number
}

export const parseWav = (wav: Buffer): PcmAudio => {
  if (wav.length < 44 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('TTS synthesis returned an invalid WAV response')
  }

  const sampleRate = wav.readUInt32LE(24)
  const dataOffset = wav.indexOf('data', 12, 'ascii')
  if (dataOffset < 0 || dataOffset + 8 > wav.length) {
    throw new Error('TTS synthesis returned a WAV response without audio data')
  }

  const dataSize = wav.readUInt32LE(dataOffset + 4)
  return { buffer: wav.subarray(dataOffset + 8, dataOffset + 8 + dataSize), sampleRate }
}

export const createSpeechRequest = (
  text: string,
  speakerId: string,
  model: string,
  params: IrodoriOptions = {}
): SpeechRequest => ({
  model,
  input: text,
  voice: speakerId,
  response_format: 'wav',
  irodori: params
})

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
