import type { Client } from 'discord.js'
import { registerGuildHandler } from './guild'
import { registerInteractionHandler } from './interaction'
import { registerMessageHandler } from './message'
import { registerReadyHandler } from './ready'
import { registerVoiceStateHandler } from './voice-state'

export const registerAllEvents = (client: Client): void => {
  registerReadyHandler(client)
  registerGuildHandler(client)
  registerInteractionHandler(client)
  registerVoiceStateHandler(client)
  registerMessageHandler(client)
}
