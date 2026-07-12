import type { Client } from 'discord.js'
import {
  getCurrentSpeakerContext,
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
      const { speakerId, config: speakerConfig } = await getCurrentSpeakerContext(message.author.id)

      // 全行の合成は並列で開始する（サーバー負荷は従来と同じ）
      const synthPromises = lines.map((line, lineIndex) =>
        textToSpeechWithSettings(line, speakerId, speakerConfig, {
          authorId: message.author.id,
          lineIndex
        }).catch((err) => ({ __failed: true, err, line }) as const)
      )

      // 解決を発生順（＝行の順番）で待ってキューに積む
      // 1行ずつ即キューへ回せるので最初の再生が全行合成を待たずに始まり、
      // かつ同一メッセージ内の行順もここで保証される
      for (const promise of synthPromises) {
        const result = await promise
        if ('__failed' in result) {
          await notifyError('TTS synthesis failed for line', result.err, { guildId, line: result.line })
          continue
        }
        enqueueAudio(guildId, result, connection)
      }
    } catch (error) {
      await notifyError('Failed to process TTS', error, { guildId })
    }
  })
}
