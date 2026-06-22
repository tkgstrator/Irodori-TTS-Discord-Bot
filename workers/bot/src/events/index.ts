import type { Client } from 'discord.js'
import { registerInteractionHandler } from './interaction'
import { registerMessageHandler } from './message'
import { registerReadyHandler } from './ready'
import { registerVoiceStateHandler } from './voice-state'

export const registerAllEvents = (client: Client): void => {
  registerReadyHandler(client)
  registerInteractionHandler(client)
  registerVoiceStateHandler(client)
  registerMessageHandler(client)
}
