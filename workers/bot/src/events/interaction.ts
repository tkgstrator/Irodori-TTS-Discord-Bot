import type { Client } from 'discord.js'
import { MessageFlags } from 'discord.js'
import { executeCommand } from '../commands'
import { notifyError } from '../utils/notifier'

export const registerInteractionHandler = (client: Client): void => {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return

    try {
      await executeCommand(interaction)
    } catch (error) {
      await notifyError('Command execution error', error, {
        command: interaction.commandName,
        guildId: interaction.guildId ?? 'unknown'
      })
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: 'コマンドの実行中にエラーが発生しました',
            flags: MessageFlags.Ephemeral
          })
        } else {
          await interaction.reply({
            content: 'コマンドの実行中にエラーが発生しました',
            flags: MessageFlags.Ephemeral
          })
        }
      } catch {
        // Interactionトークン期限切れ — notifyError で既に記録済み
      }
    }
  })
}
