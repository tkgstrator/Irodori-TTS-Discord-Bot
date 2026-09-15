import type { IrodoriOptions, SpeechRequest } from '@irodori-tts/shared/irodori-api'

export interface ParsedPcmAudio {
  buffer: Buffer
  sampleRate: number
}

export const parseWav = (wav: Buffer): ParsedPcmAudio => {
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
