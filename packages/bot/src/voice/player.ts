import { Readable } from 'node:stream'
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  StreamType,
  type VoiceConnection,
  VoiceConnectionStatus
} from '@discordjs/voice'
import { notifyError } from '../utils/notifier'
import type { PcmAudio } from '../utils/tts'

const createWavHeader = (sampleRate: number): Buffer => {
  const header = Buffer.alloc(44)
  const channels = 1
  const bitsPerSample = 16
  const byteRate = sampleRate * channels * (bitsPerSample / 8)
  const blockAlign = channels * (bitsPerSample / 8)
  // FFmpeg reads until EOF regardless of declared size
  const dataSize = 0x7fffffff

  header.write('RIFF', 0)
  header.writeUInt32LE(dataSize + 36, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)

  return header
}

const guildPlayers = new Map<
  string,
  {
    player: ReturnType<typeof createAudioPlayer>
    queue: PcmAudio[]
    isPlaying: boolean
  }
>()

const getOrCreatePlayer = (guildId: string, connection: VoiceConnection) => {
  const existing = guildPlayers.get(guildId)
  if (existing) return existing

  const player = createAudioPlayer()

  player.on('stateChange', (oldState, newState) => {
    console.debug(`Player state changed: ${oldState.status} -> ${newState.status}`)
  })

  player.on(AudioPlayerStatus.Idle, () => {
    console.debug('Player became idle')
    const gp = guildPlayers.get(guildId)
    if (gp && gp.queue.length > 0) {
      const next = gp.queue.shift()
      if (next) {
        void playAudio(guildId, next, connection)
      }
    } else if (gp) {
      gp.isPlaying = false
    }
  })

  player.on('error', (error) => {
    console.error(`Audio player error in guild ${guildId}:`, error)
    void notifyError('Audio player error', error, { guildId })
    const gp = guildPlayers.get(guildId)
    if (gp) {
      gp.isPlaying = false
      if (gp.queue.length > 0) {
        const next = gp.queue.shift()
        if (next) {
          void playAudio(guildId, next, connection)
        }
      }
    }
  })

  connection.subscribe(player)

  const guildPlayer = {
    player,
    queue: [] as PcmAudio[],
    isPlaying: false
  }
  guildPlayers.set(guildId, guildPlayer)
  return guildPlayer
}

const playAudio = async (guildId: string, audio: PcmAudio, connection: VoiceConnection): Promise<void> => {
  console.debug('Playing audio for guild:', guildId, 'size:', audio.buffer.length, 'sampleRate:', audio.sampleRate)

  if (connection.state.status === VoiceConnectionStatus.Destroyed) {
    console.warn(`Skipping playback: connection destroyed in guild ${guildId}`)
    destroyPlayer(guildId)
    return
  }

  if (connection.state.status !== VoiceConnectionStatus.Ready) {
    console.debug('Waiting for connection to be ready...')
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5_000)
    } catch {
      console.error('Connection failed to become ready')
      return
    }
  }

  const guildPlayer = getOrCreatePlayer(guildId, connection)
  const wavHeader = createWavHeader(audio.sampleRate)
  const stream = Readable.from(Buffer.concat([wavHeader, audio.buffer]))
  const resource = createAudioResource(stream, {
    inputType: StreamType.Arbitrary,
    inlineVolume: false
  })
  guildPlayer.player.play(resource)
  guildPlayer.isPlaying = true
}

export const enqueueAudio = async (guildId: string, audio: PcmAudio, connection: VoiceConnection): Promise<void> => {
  const guildPlayer = getOrCreatePlayer(guildId, connection)

  if (guildPlayer.isPlaying) {
    guildPlayer.queue.push(audio)
  } else {
    await playAudio(guildId, audio, connection)
  }
}

export const playStream = async (
  guildId: string,
  pcmStream: import('node:stream').Readable,
  sampleRate: number,
  connection: VoiceConnection
): Promise<void> => {
  if (connection.state.status === VoiceConnectionStatus.Destroyed) {
    destroyPlayer(guildId)
    return
  }

  if (connection.state.status !== VoiceConnectionStatus.Ready) {
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5_000)
    } catch {
      throw new Error('Connection failed to become ready')
    }
  }

  const guildPlayer = getOrCreatePlayer(guildId, connection)
  const wavHeader = createWavHeader(sampleRate)

  const { PassThrough } = await import('node:stream')
  const passThrough = new PassThrough()
  passThrough.write(wavHeader)
  pcmStream.pipe(passThrough)

  const resource = createAudioResource(passThrough, {
    inputType: StreamType.Arbitrary,
    inlineVolume: false
  })

  return new Promise<void>((resolve, reject) => {
    guildPlayer.player.play(resource)
    guildPlayer.isPlaying = true

    const onIdle = () => {
      cleanup()
      guildPlayer.isPlaying = false
      resolve()
    }

    const onError = (error: Error) => {
      cleanup()
      guildPlayer.isPlaying = false
      reject(error)
    }

    const cleanup = () => {
      guildPlayer.player.removeListener(AudioPlayerStatus.Idle, onIdle)
      guildPlayer.player.removeListener('error', onError)
    }

    guildPlayer.player.on(AudioPlayerStatus.Idle, onIdle)
    guildPlayer.player.on('error', onError)
  })
}

export const clearQueue = (guildId: string): void => {
  const guildPlayer = guildPlayers.get(guildId)
  if (guildPlayer) {
    guildPlayer.queue = []
    guildPlayer.player.stop()
    guildPlayer.isPlaying = false
  }
}

export const destroyPlayer = (guildId: string): void => {
  const guildPlayer = guildPlayers.get(guildId)
  if (guildPlayer) {
    guildPlayer.player.stop()
    guildPlayers.delete(guildId)
  }
}
