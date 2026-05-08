import { Readable } from 'node:stream'
import type { VoiceConnection } from '@discordjs/voice'
import type { Cue, VdsJson } from '@irodori-tts/shared/voice-drama'
import { IRODORI_TTS_BASE_URL } from '../utils/client'
import { playStream } from '../voice/player'

const RUBY_PATTERN = /\|[^[]+\[([^\]]+)\]/g

const resolveRubyCues = (cues: readonly Cue[]): Cue[] =>
  cues.map((cue) => (cue.kind === 'speech' ? { ...cue, text: cue.text.replace(RUBY_PATTERN, '$1') } : { ...cue }))

export const playVds = async (vds: VdsJson, guildId: string, connection: VoiceConnection): Promise<void> => {
  const resolvedVds: VdsJson = { ...vds, cues: resolveRubyCues(vds.cues) }

  const response = await fetch(`${IRODORI_TTS_BASE_URL}/synth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/pcm'
    },
    body: JSON.stringify({ script: resolvedVds })
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
