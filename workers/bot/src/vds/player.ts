import type { VoiceConnection } from '@discordjs/voice'
import type { Cue, VdsJson } from '@irodori-tts/shared/voice-drama'
import { synthesize } from '../utils/tts'
import { enqueueAudio } from '../voice/player'

const RUBY_PATTERN = /\|[^[]+\[([^\]]+)\]/g

const resolveRubyCues = (cues: readonly Cue[]): Cue[] =>
  cues.map((cue) => (cue.kind === 'speech' ? { ...cue, text: cue.text.replace(RUBY_PATTERN, '$1') } : { ...cue }))

export const playVds = async (vds: VdsJson, guildId: string, connection: VoiceConnection): Promise<void> => {
  const resolvedVds: VdsJson = { ...vds, cues: resolveRubyCues(vds.cues) }

  for (const cue of resolvedVds.cues) {
    if (cue.kind !== 'speech') {
      continue
    }

    const speaker = resolvedVds.speakers[cue.speaker]
    if (speaker === undefined) {
      throw new Error(`VDS speaker is not defined: ${cue.speaker}`)
    }

    const voice = speaker.type === 'lora' ? speaker.uuid : 'none'
    const caption = speaker.type === 'caption' ? speaker.caption : undefined
    const { gap: _gap, ...defaults } = resolvedVds.defaults ?? {}
    const audio = await synthesize(cue.text, voice, { ...defaults, ...cue.options, caption })
    await enqueueAudio(guildId, audio, connection)
  }
}
