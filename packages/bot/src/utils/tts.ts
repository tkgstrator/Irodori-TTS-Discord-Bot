import axios from 'axios'
import { config } from '../config'
import type { SpeakerInfo, SynthRequest } from '@irodori-tts/shared/irodori-api'
import type { SpeakerConfig } from '../schemas/user-settings.dto'
import { irodoriClient } from './client'

/**
 * 話者一覧を取得する
 * @returns 話者一覧
 */
export const getSpeakers = async (): Promise<SpeakerInfo[]> => {
  const res = await irodoriClient.getSpeakers()
  return res.speakers
}

/**
 * 指定話者でテキストを音声合成する
 * @param text 合成するテキスト
 * @param speakerId 話者UUID
 * @param params 追加のサンプリングパラメータ（任意）
 * @returns WAV音声データ
 */
export const synthesize = async (
  text: string,
  speakerId: string,
  params: Omit<SynthRequest, 'speaker_id' | 'text'> = {}
): Promise<Buffer> => {
  // Zodiosではarraybufferが正しく処理されないため、直接axiosを使用
  const response = await axios.post<ArrayBuffer>(
    `${config.IRODORI_TTS_BASE_URL}/synth`,
    { speaker_id: speakerId, text, ...params },
    { responseType: 'arraybuffer' }
  )
  return Buffer.from(response.data)
}

/**
 * テキストから直接音声を合成する
 * @param text 合成するテキスト
 * @param speakerId 話者UUID
 * @returns WAV音声データ
 */
export const textToSpeech = async (text: string, speakerId: string): Promise<Buffer> => {
  return await synthesize(text, speakerId)
}

/**
 * ユーザー設定を `/synth` のオプションへ展開する
 */
const toSynthParams = (cfg: SpeakerConfig): Omit<SynthRequest, 'speaker_id' | 'text'> => ({
  seed: cfg.seed,
  num_steps: cfg.numSteps,
  cfg_scale_text: cfg.cfgScaleText,
  cfg_scale_speaker: cfg.cfgScaleSpeaker,
  speaker_kv_scale: cfg.speakerKvScale,
  truncation_factor: cfg.truncationFactor
})

/**
 * ユーザー設定を適用してテキストを音声合成する
 * @param text 合成するテキスト
 * @param speakerId 話者UUID
 * @param speakerConfig 話者設定
 * @returns WAV音声データ
 */
export const textToSpeechWithSettings = async (
  text: string,
  speakerId: string,
  speakerConfig: SpeakerConfig
): Promise<Buffer> => {
  console.debug('TTS request:', { text, speakerId })
  return await synthesize(text, speakerId, toSynthParams(speakerConfig))
}
