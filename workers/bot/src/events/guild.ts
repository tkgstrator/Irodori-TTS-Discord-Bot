import { BOT_GUILDS_KEY } from '@irodori-tts/shared/settings'
import type { Client } from 'discord.js'
import { notifyError } from '../utils/notifier'
import { redis } from '../utils/redis'

/**
 * ギルド参加・脱退イベントを `bot:guilds` に反映する
 *
 * WebUI側はこのSetを参照してBotの在籍判定を行う。
 * 取りこぼしてもready時の全再同期で自己修復される。
 */
export const registerGuildHandler = (client: Client): void => {
  client.on('guildCreate', async (guild) => {
    try {
      await redis.sadd(BOT_GUILDS_KEY, guild.id)
      console.log(`Joined guild ${guild.id}, added to ${BOT_GUILDS_KEY}`)
    } catch (error) {
      await notifyError('Failed to add guild to bot:guilds', error, { guildId: guild.id })
    }
  })

  client.on('guildDelete', async (guild) => {
    try {
      await redis.srem(BOT_GUILDS_KEY, guild.id)
      console.log(`Left guild ${guild.id}, removed from ${BOT_GUILDS_KEY}`)
    } catch (error) {
      await notifyError('Failed to remove guild from bot:guilds', error, { guildId: guild.id })
    }
  })
}
