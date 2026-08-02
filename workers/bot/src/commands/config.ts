import { type ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js'
import { config } from '../config'

/**
 * /config コマンドの定義
 *
 * 話者設定もサーバー設定もダッシュボードに集約したため、
 * このコマンドは設定画面のURLを案内するだけにしている。
 */
export const configCommand = new SlashCommandBuilder()
  .setName('config')
  .setDescription('設定画面（ダッシュボード）のURLを表示します')

/**
 * /config コマンドのハンドラー
 */
export const handleConfigCommand = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const embed = new EmbedBuilder()
    .setTitle('設定はこちらから')
    .setColor(0x00ae86)
    .setURL(config.DASHBOARD_BASE_URL)
    .setDescription(
      [
        `${config.DASHBOARD_BASE_URL}`,
        '',
        'Discordでログインすると、話者や読み上げの設定を変更できます。',
        'サーバー設定の変更には「サーバー管理」権限が必要です。'
      ].join('\n')
    )

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
}
