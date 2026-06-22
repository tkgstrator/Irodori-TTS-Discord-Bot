import type { Client } from 'discord.js'
import {
  getCurrentSpeakerConfig,
  getCurrentSpeakerId,
  getGuildSettings,
  preprocessForTts,
  preprocessMessageForTts,
  textToSpeechWithSettings
} from '../utils'
import { notifyError } from '../utils/notifier'
import { enqueueAudio, getConnection } from '../voice'

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
      const speakerId = await getCurrentSpeakerId(message.author.id)
      const speakerConfig = await getCurrentSpeakerConfig(message.author.id)
      // 全行を並列合成してからまとめてキューに積む（逐次合成だと行間に他ユーザーが割り込む）
      const audioStreams = await Promise.all(
        lines.map((line) => textToSpeechWithSettings(line, speakerId, speakerConfig))
      )
      for (const audioStream of audioStreams) {
        enqueueAudio(guildId, audioStream, connection)
      }
    } catch (error) {
      await notifyError('Failed to process TTS', error, { guildId })
    }
  })
}
