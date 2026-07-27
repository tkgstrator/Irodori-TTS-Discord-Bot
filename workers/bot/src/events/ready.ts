import { BOT_GUILDS_KEY } from '@irodori-tts/shared/settings'
import type { Client } from 'discord.js'
import { REST, Routes } from 'discord.js'
import { commands } from '../commands'
import { config } from '../config'
import { notifyError } from '../utils/notifier'
import { redis } from '../utils/redis'

const registerCommands = async (clientId: string): Promise<void> => {
  const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN)
  try {
    console.log('Registering slash commands...')
    await rest.put(Routes.applicationCommands(clientId), { body: commands })
    console.log('Slash commands registered successfully')
  } catch (error) {
    await notifyError('Failed to register commands', error, { clientId })
  }
}

/**
 * Botが参加中のギルドID集合をRedisへ全再同期する
 *
 * WebUI側は `bot:guilds` を参照してBotの在籍判定を行うため、
 * 起動のたびにDEL+SADDで作り直し、ダウンタイム中のズレを自己修復する。
 */
const syncBotGuilds = async (client: Client): Promise<void> => {
  const guildIds = [...client.guilds.cache.keys()]
  try {
    const multi = redis.multi().del(BOT_GUILDS_KEY)
    const withMembers = guildIds.length > 0 ? multi.sadd(BOT_GUILDS_KEY, ...guildIds) : multi
    await withMembers.exec()
    console.log(`Synced ${guildIds.length} guild(s) to ${BOT_GUILDS_KEY}`)
  } catch (error) {
    await notifyError('Failed to sync bot guilds', error, { guildCount: String(guildIds.length) })
  }
}

export const registerReadyHandler = (client: Client): void => {
  client.once('ready', async (readyClient) => {
    console.log(`Bot is ready! Logged in as ${readyClient.user.tag}`)
    await registerCommands(readyClient.user.id)
    await syncBotGuilds(readyClient)
  })
}
