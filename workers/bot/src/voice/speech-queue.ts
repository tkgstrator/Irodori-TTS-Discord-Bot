import type { VoiceConnection } from '@discordjs/voice'
import type { SpeakerConfig } from '@irodori-tts/shared/settings'
import { notifyError } from '../utils/notifier'
import { textToSpeechWithSettings } from '../utils/tts'
import { enqueueAudio } from './player'

export interface SpeechTask {
  text: string
  speakerId: string
  speakerConfig: SpeakerConfig
  connection: VoiceConnection
  authorId?: string
  lineIndex?: number
}

interface GuildSpeechQueue {
  tasks: SpeechTask[]
  isProcessing: boolean
}

const guildQueues = new Map<string, GuildSpeechQueue>()

const getOrCreateQueue = (guildId: string): GuildSpeechQueue => {
  const existing = guildQueues.get(guildId)
  if (existing) return existing

  const created: GuildSpeechQueue = { tasks: [], isProcessing: false }
  guildQueues.set(guildId, created)
  return created
}

/**
 * キュー先頭から1件ずつ直列で合成する。
 * Irodori-TTSサーバー側のトークナイザーが並行呼び出しに非対応で
 * "RuntimeError: Already borrowed" を起こすため、投入順を守ったまま並列化はしない
 */
const processQueue = async (guildId: string): Promise<void> => {
  const queue = guildQueues.get(guildId)
  if (!queue) return

  const task = queue.tasks.shift()
  if (task === undefined) {
    queue.isProcessing = false
    return
  }

  try {
    const audio = await textToSpeechWithSettings(task.text, task.speakerId, task.speakerConfig, {
      authorId: task.authorId,
      lineIndex: task.lineIndex
    })
    await enqueueAudio(guildId, audio, task.connection)
  } catch (error) {
    await notifyError('TTS synthesis failed for queued task', error, { guildId, line: task.text })
  }

  await processQueue(guildId)
}

/**
 * 発話タスクをギルドごとのキューへ積む。
 * 呼び出し時点の話者・設定をタスクにスナップショットして保持するため、
 * 合成待ちの間に他ユーザーの発言が割り込んでも話者が混ざらない
 */
export const enqueueSpeechTask = (guildId: string, task: SpeechTask): void => {
  const queue = getOrCreateQueue(guildId)
  queue.tasks.push(task)
  if (!queue.isProcessing) {
    queue.isProcessing = true
    void processQueue(guildId)
  }
}
