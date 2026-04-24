import { VdsJsonSchema } from '@irodori-tts/shared/voice-drama'
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js'
import { playVds } from '../vds'
import { getConnection } from '../voice'

export const playCommand = new SlashCommandBuilder()
  .setName('play')
  .setDescription('VDS JSON ファイルを再生します')
  .addAttachmentOption((option) => option.setName('file').setDescription('VDS JSON ファイル').setRequired(true))

export const handlePlayCommand = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const guildId = interaction.guildId

  if (!guildId) {
    await interaction.reply({
      content: 'サーバー内で実行してください',
      flags: MessageFlags.Ephemeral
    })
    return
  }

  const connection = getConnection(guildId)

  if (!connection) {
    await interaction.reply({
      content: 'ボイスチャンネルに接続していません。先に /join を実行してください',
      flags: MessageFlags.Ephemeral
    })
    return
  }

  const attachment = interaction.options.getAttachment('file', true)

  if (!attachment.name.endsWith('.json')) {
    await interaction.reply({
      content: 'JSON ファイルを添付してください',
      flags: MessageFlags.Ephemeral
    })
    return
  }

  if (attachment.size > 1024 * 1024) {
    await interaction.reply({
      content: 'ファイルサイズが大きすぎます（上限: 1MB）',
      flags: MessageFlags.Ephemeral
    })
    return
  }

  await interaction.deferReply()

  try {
    const response = await fetch(attachment.url)
    const body = await response.json()
    const parseResult = VdsJsonSchema.safeParse(body)

    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`).join('\n')
      await interaction.editReply(`VDS JSON のバリデーションに失敗しました:\n\`\`\`\n${issues}\n\`\`\``)
      return
    }

    const vds = parseResult.data
    const cueCount = vds.cues.filter((cue) => cue.kind === 'speech').length
    await interaction.editReply(`${vds.title ?? 'VDS'} を再生します（${cueCount} セリフ）...`)

    await playVds(vds, guildId, connection)
    await interaction.followUp('再生完了')
  } catch (error) {
    console.error('VDS playback failed:', error)
    await interaction.editReply('VDS の再生に失敗しました')
  }
}
