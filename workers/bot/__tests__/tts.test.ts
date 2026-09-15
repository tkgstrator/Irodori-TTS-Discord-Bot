import { describe, expect, test } from 'bun:test'
import { createSpeechRequest, parseWav } from '../src/utils/tts'

const createWav = (sampleRate: number, pcm: Buffer): Buffer => {
  const wav = Buffer.alloc(44 + pcm.length)
  wav.write('RIFF', 0)
  wav.writeUInt32LE(wav.length - 8, 4)
  wav.write('WAVE', 8)
  wav.write('fmt ', 12)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(sampleRate, 24)
  wav.writeUInt32LE(sampleRate * 2, 28)
  wav.writeUInt16LE(2, 32)
  wav.writeUInt16LE(16, 34)
  wav.write('data', 36)
  wav.writeUInt32LE(pcm.length, 40)
  pcm.copy(wav, 44)
  return wav
}

describe('Irodori-TTS OpenAI互換リクエスト', () => {
  test('合成設定をirodoriオブジェクトに入れる', () => {
    expect(createSpeechRequest('こんにちは', 'speaker-a', 'irodori-tts', { num_steps: 24 })).toEqual({
      model: 'irodori-tts',
      input: 'こんにちは',
      voice: 'speaker-a',
      response_format: 'wav',
      irodori: { num_steps: 24 }
    })
  })

  test('WAVからPCMとサンプルレートを取り出す', () => {
    const pcm = Buffer.from([1, 2, 3, 4])
    expect(parseWav(createWav(48000, pcm))).toEqual({ buffer: pcm, sampleRate: 48000 })
  })

  test('不正なWAVを拒否する', () => {
    expect(() => parseWav(Buffer.from('not a wav'))).toThrow('invalid WAV')
  })
})
