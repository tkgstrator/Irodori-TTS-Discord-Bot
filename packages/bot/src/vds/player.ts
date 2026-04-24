import { Readable } from 'node:stream'
import type { VoiceConnection } from '@discordjs/voice'
import type { VdsJson } from '@irodori-tts/shared/voice-drama'
import { IRODORI_TTS_BASE_URL } from '../utils/client'
import { playStream } from '../voice/player'

export const playVds = async (vds: VdsJson, guildId: string, connection: VoiceConnection): Promise<void> => {
  const response = await fetch(`${IRODORI_TTS_BASE_URL}/synth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/pcm'
    },
    body: JSON.stringify({ script: vds })
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`VDS synthesis failed: ${response.status} ${response.statusText} ${detail}`)
  }

  if (!response.body) {
    throw new Error('VDS synthesis returned empty body')
  }

  const sampleRate = Number(response.headers.get('X-TTS-Sample-Rate') ?? '24000')
  const pcmStream = Readable.fromWeb(response.body as import('node:stream/web').ReadableStream)

  await playStream(guildId, pcmStream, sampleRate, connection)
}
