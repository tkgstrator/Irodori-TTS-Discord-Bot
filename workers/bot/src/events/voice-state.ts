import type { Client } from 'discord.js'
import { getCurrentSpeakerConfig, getCurrentSpeakerId, getGuildSettings, textToSpeechWithSettings } from '../utils'
import { notifyError } from '../utils/notifier'
import { connectToChannel, destroyPlayer, disconnectFromChannel, enqueueAudio, getConnection } from '../voice'

export const registerVoiceStateHandler = (client: Client): void => {
  client.on('voiceStateUpdate', async (oldState, newState) => {
    const guildId = newState.guild.id

    // Bot自身のVCからの切断を検知 → プレイヤーをクリーンアップ
    if (newState.member?.id === newState.client.user?.id) {
      if (oldState.channel && !newState.channel) {
        console.log(`Bot was disconnected from VC in guild: ${guildId}`)
        destroyPlayer(guildId)
      }
      return
    }

    // 他のBotの状態変更は無視
    if (newState.member?.user.bot) return

    const guildSettings = await getGuildSettings(guildId)
    const connection = getConnection(guildId)
    const botChannelId = connection?.joinConfig.channelId

    // Botがいるチャンネルの人数チェック（参加・離脱どちらのイベントでも実施）
    if (connection && botChannelId) {
      const botChannel = newState.guild.channels.cache.get(botChannelId)
      if (botChannel?.isVoiceBased()) {
        // ミュート/デフ等で同一チャンネルに留まる場合はメンバーを除外しない
        const memberLeftBotChannel = oldState.channelId === botChannelId && newState.channelId !== botChannelId
        const remainingMembers = botChannel.members.filter(
          (member) => !member.user.bot && (!memberLeftBotChannel || member.id !== newState.member?.id)
        )

        if (remainingMembers.size === 0) {
          if (newState.channel && newState.channelId !== botChannelId) {
            // 最後の1人が別チャンネルに移動した → 追従
            try {
              destroyPlayer(guildId)
              await connectToChannel(newState.channel)
            } catch (error) {
              await notifyError('Failed to move to new voice channel', error, { guildId })
              disconnectFromChannel(guildId)
            }
          } else {
            // チャンネルが空になった → 離脱
            destroyPlayer(guildId)
            disconnectFromChannel(guildId)
          }
          return
        }
      }
    }

    // ユーザーがVCに参加した場合
    if (!oldState.channel && newState.channel) {
      // Botがまだ接続していない場合のみ参加
      if (!connection) {
        try {
          await connectToChannel(newState.channel)
        } catch (error) {
          await notifyError('Failed to connect to voice channel', error, { guildId })
        }
      }

      // 参加アナウンス
      const activeConnection = connection || getConnection(guildId)
      if (activeConnection && guildSettings.announceJoin && newState.member) {
        try {
          const speakerId = await getCurrentSpeakerId(newState.member.user.id)
          const speakerConfig = await getCurrentSpeakerConfig(newState.member.user.id)
          const username = newState.member.displayName || newState.member.user.username
          const audioStream = await textToSpeechWithSettings(`${username}が参加しました`, speakerId, speakerConfig)
          enqueueAudio(guildId, audioStream, activeConnection)
        } catch (error) {
          await notifyError('Failed to announce join', error, { guildId })
        }
      }
      return
    }

    // 離脱アナウンス（完全退出のみ、チャンネル移動は除く）
    if (oldState.channel && !newState.channel && connection && guildSettings.announceLeave && newState.member) {
      try {
        const speakerId = await getCurrentSpeakerId(newState.member.user.id)
        const speakerConfig = await getCurrentSpeakerConfig(newState.member.user.id)
        const username = newState.member.displayName || newState.member.user.username
        const audioStream = await textToSpeechWithSettings(`${username}が退席しました`, speakerId, speakerConfig)
        enqueueAudio(guildId, audioStream, connection)
      } catch (error) {
        await notifyError('Failed to announce leave', error, { guildId })
      }
    }
  })
}
