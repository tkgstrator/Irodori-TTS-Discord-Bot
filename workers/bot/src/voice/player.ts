import { PassThrough, Readable } from 'node:stream'
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
import { getConnection } from '.'

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

/**
 * キューの次のアイテムを再生する
 * 再生中フラグの更新と接続の再取得を一箇所に集約し、
 * 状態の不整合（デッドロック・二重再生）を防ぐ
 * @param guildId ギルドID
 */
const advanceQueue = (guildId: string): void => {
  const gp = guildPlayers.get(guildId)
  if (!gp) return

  const next = gp.queue.shift()
  if (!next) {
    gp.isPlaying = false
    return
  }

  const connection = getConnection(guildId)
  if (!connection) {
    console.warn(`No active connection for guild ${guildId}, dropping queued audio`)
    gp.isPlaying = false
    return
  }

  gp.isPlaying = true
  void playAudio(guildId, next, connection)
}

const getOrCreatePlayer = (guildId: string, connection: VoiceConnection) => {
  const existing = guildPlayers.get(guildId)
  if (existing) return existing

  const player = createAudioPlayer()

  player.on('stateChange', (oldState, newState) => {
    console.debug(`Player state changed: ${oldState.status} -> ${newState.status}`)
  })

  player.on(AudioPlayerStatus.Idle, () => {
    console.debug('Player became idle')
    advanceQueue(guildId)
  })

  player.on('error', (error) => {
    console.error(`Audio player error in guild ${guildId}:`, error)
    void notifyError('Audio player error', error, { guildId })
    advanceQueue(guildId)
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
  console.debug(
    'Playing audio for guild:',
    guildId,
    'size:',
    audio.buffer.length,
    'sampleRate:',
    audio.sampleRate,
    'authorId:',
    audio.authorId,
    'lineIndex:',
    audio.lineIndex
  )

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
      advanceQueue(guildId)
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
}

export const enqueueAudio = async (guildId: string, audio: PcmAudio, connection: VoiceConnection): Promise<void> => {
  const guildPlayer = getOrCreatePlayer(guildId, connection)

  if (guildPlayer.isPlaying) {
    guildPlayer.queue.push(audio)
  } else {
    // await より前に同期的にフラグを立て、並行呼び出しによる二重再生を防ぐ
    guildPlayer.isPlaying = true
    await playAudio(guildId, audio, connection)
  }
}

const QUEUE_DRAIN_TIMEOUT_MS = 30_000

const isQueueDrained = (guildId: string): boolean => {
  const gp = guildPlayers.get(guildId)
  if (!gp) return true
  return !gp.isPlaying && gp.queue.length === 0
}

/**
 * TTSキューが完全に空になる（再生中でもキュー待ちでもない）まで待つ。
 * playStream（VDS等の単発ストリーム再生）が進行中のTTSを打ち切らないようにするための待機。
 * @param guildId ギルドID
 * @param timeoutMs 最大待機時間。タイムアウト時は諦めて先に進む
 */
const waitForQueueDrain = (guildId: string, timeoutMs: number = QUEUE_DRAIN_TIMEOUT_MS): Promise<void> => {
  if (isQueueDrained(guildId)) return Promise.resolve()

  const gp = guildPlayers.get(guildId)
  if (!gp) return Promise.resolve()

  return new Promise<void>((resolve) => {
    const check = () => {
      if (isQueueDrained(guildId)) {
        cleanup()
        resolve()
      }
    }

    const timeoutId = setTimeout(() => {
      console.warn(`Timed out waiting for queue drain in guild ${guildId}, proceeding anyway`)
      cleanup()
      resolve()
    }, timeoutMs)

    const cleanup = () => {
      clearTimeout(timeoutId)
      gp.player.removeListener(AudioPlayerStatus.Idle, check)
    }

    gp.player.on(AudioPlayerStatus.Idle, check)
  })
}

export const playStream = async (
  guildId: string,
  pcmStream: Readable,
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

  // 進行中のTTSキューを打ち切らないよう、キューが空になるまで待つ
  await waitForQueueDrain(guildId)

  const wavHeader = createWavHeader(sampleRate)

  const passThrough = new PassThrough()
  passThrough.write(wavHeader)
  pcmStream.pipe(passThrough)

  const resource = createAudioResource(passThrough, {
    inputType: StreamType.Arbitrary,
    inlineVolume: false
  })

  return new Promise<void>((resolve, reject) => {
    guildPlayer.player.play(resource)
    // ストリーム再生中は isPlaying を立てておき、並行する enqueueAudio をキューへ退避させる
    guildPlayer.isPlaying = true

    const onIdle = () => {
      cleanup()
      // isPlaying とキューの前進はグローバル Idle ハンドラー（advanceQueue）が管理するため、ここでは変更しない
      resolve()
    }

    const onError = (error: Error) => {
      cleanup()
      // isPlaying とキューの前進はグローバル error ハンドラー（advanceQueue）が管理するため、ここでは変更しない
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

export const destroyPlayer = (guildId: string): void => {
  const guildPlayer = guildPlayers.get(guildId)
  if (guildPlayer) {
    guildPlayer.player.stop()
    guildPlayers.delete(guildId)
  }
}
