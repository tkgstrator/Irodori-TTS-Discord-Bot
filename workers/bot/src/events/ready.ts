import type { Client } from 'discord.js'
import { REST, Routes } from 'discord.js'
import { commands } from '../commands'
import { config } from '../config'

const registerCommands = async (clientId: string): Promise<void> => {
  const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN)
  try {
    console.log('Registering slash commands...')
    await rest.put(Routes.applicationCommands(clientId), { body: commands })
    console.log('Slash commands registered successfully')
  } catch (error) {
    console.error('Failed to register slash commands:', error)
  }
}

export const registerReadyHandler = (client: Client): void => {
  client.once('ready', async (readyClient) => {
    console.log(`Bot is ready! Logged in as ${readyClient.user.tag}`)
    await registerCommands(readyClient.user.id)
  })
}
