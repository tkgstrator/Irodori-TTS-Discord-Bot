import type { Client } from 'discord.js'
import { getCurrentSpeakerContext, getGuildSettings, preprocessForTts, preprocessMessageForTts } from '../utils'
import { notifyError } from '../utils/notifier'
import { enqueueSpeechTask, getConnection } from '../voice'

export const registerMessageHandler = (client: Client): void => {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return
    if (!message.guild) return
    if (!message.content.trim()) return

    const guildId = message.guild.id
    const connection = getConnection(guildId)
    if (!connection) return

    const guildSettings = await getGuildSettings(guildId)
    const member = message.member
    const botVoiceChannelId = message.guild.members.me?.voice.channelId
    const isInSameChannel = member?.voice.channelId === botVoiceChannelId

    // VCのテキストチャンネル以外の場合は追加チェック
    const isVcTextChannel = message.channel.id === botVoiceChannelId
    if (!isVcTextChannel) {
      if (guildSettings.readChannels.length > 0 && !guildSettings.readChannels.includes(message.channel.id)) {
        return
      }
      if (!isInSameChannel && !guildSettings.readNonVcUsers) {
        return
      }
    }

    const lines = preprocessMessageForTts(message.content)
      .split('\n')
      .map((line) => preprocessForTts(line))
      .filter((line): line is string => line !== null)
    if (lines.length === 0) return

    try {
      const { speakerId, config: speakerConfig } = await getCurrentSpeakerContext(message.author.id)

      // 受信した時点で話者・設定をスナップショットしてギルドの発話キューへ積む。
      // 合成待ちの間に他ユーザーの発言が割り込んでも話者は混ざらず、行の順序も保たれる
      lines.forEach((line, lineIndex) => {
        enqueueSpeechTask(guildId, {
          text: line,
          speakerId,
          speakerConfig,
          connection,
          authorId: message.author.id,
          lineIndex
        })
      })
    } catch (error) {
      await notifyError('Failed to process TTS', error, { guildId })
    }
  })
}
