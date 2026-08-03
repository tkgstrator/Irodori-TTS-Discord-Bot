import type { ChatInputCommandInteraction } from 'discord.js'
import { configCommand, handleConfigCommand } from './config'
import { handleJoinCommand, handleLeaveCommand, joinCommand, leaveCommand } from './voice'

export const commands = [joinCommand.toJSON(), leaveCommand.toJSON(), configCommand.toJSON()]

/**
 * コマンドハンドラーのマップ
 */
const commandHandlers: Record<string, (interaction: ChatInputCommandInteraction) => Promise<void>> = {
  join: handleJoinCommand,
  leave: handleLeaveCommand,
  config: handleConfigCommand
}

/**
 * コマンドを実行する
 * @param interaction コマンドインタラクション
 */
export const executeCommand = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const handler = commandHandlers[interaction.commandName]
  if (handler) {
    await handler(interaction)
  }
}
