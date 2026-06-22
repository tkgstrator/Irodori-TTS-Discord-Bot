import { Client, GatewayIntentBits } from 'discord.js'
import { config } from './config'
import { registerAllEvents } from './events'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
})

registerAllEvents(client)

console.log('Starting bot...')
client.login(config.DISCORD_TOKEN).catch((error) => {
  console.error('Failed to login:', error)
  process.exit(1)
})
