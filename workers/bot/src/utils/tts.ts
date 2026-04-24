import type { SpeakerInfo, SynthRequest } from '@irodori-tts/shared/irodori-api'
import type { SpeakerConfig } from '../schemas/user-settings.dto'
import { IRODORI_TTS_BASE_URL, irodoriClient } from './client'

export interface PcmAudio {
  buffer: Buffer
  sampleRate: number
}

export const getSpeakers = async (): Promise<SpeakerInfo[]> => {
  const res = await irodoriClient.get('/speakers')
  return res.speakers
}

export const synthesize = async (
  text: string,
  speakerId: string,
  params: Omit<SynthRequest, 'speaker_id' | 'text'> = {}
): Promise<PcmAudio> => {
  const response = await fetch(`${IRODORI_TTS_BASE_URL}/synth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/pcm'
    },
    body: JSON.stringify({ speaker_id: speakerId, text, ...params })
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`TTS synthesis failed: ${response.status} ${response.statusText} ${detail}`)
  }

  const sampleRate = Number(response.headers.get('X-TTS-Sample-Rate') ?? '24000')
  const arrayBuffer = await response.arrayBuffer()

  return { buffer: Buffer.from(arrayBuffer), sampleRate }
}

export const textToSpeech = async (text: string, speakerId: string): Promise<PcmAudio> => {
  return await synthesize(text, speakerId)
}

const toSynthParams = (cfg: SpeakerConfig): Omit<SynthRequest, 'speaker_id' | 'text'> => ({
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
  speakerConfig: SpeakerConfig
): Promise<PcmAudio> => {
  console.debug('TTS request:', { text, speakerId })
  return await synthesize(text, speakerId, toSynthParams(speakerConfig))
}
