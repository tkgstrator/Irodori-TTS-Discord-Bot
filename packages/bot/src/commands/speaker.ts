import type { SpeakerInfo } from '@irodori-tts/shared/irodori-api'
import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder
} from 'discord.js'
import type { SpeakerConfigUpdate } from '../schemas/user-settings.dto'
import {
  deleteUserSettings,
  getCurrentSpeakerConfig,
  getCurrentSpeakerId,
  getSpeakers,
  setCurrentSpeakerId,
  updateCurrentSpeakerConfig
} from '../utils'

/**
 * 話者キャッシュ（TTL 1 分）
 */
const CACHE_TTL = 60 * 1000
const speakerCache = new Map<'entry', { speakers: SpeakerInfo[]; timestamp: number }>()

/**
 * 話者キャッシュを更新する
 */
const updateSpeakerCache = async (): Promise<SpeakerInfo[]> => {
  const now = Date.now()
  const cached = speakerCache.get('entry')
  if (cached !== undefined && now - cached.timestamp < CACHE_TTL && cached.speakers.length > 0) {
    return cached.speakers
  }

  try {
    const fresh = await getSpeakers()
    speakerCache.set('entry', { speakers: fresh, timestamp: now })
    return fresh
  } catch (error) {
    console.error('Failed to update speaker cache:', error)
    return cached?.speakers ?? []
  }
}

/**
 * `/speaker config` で設定可能な項目
 */
type ConfigField =
  | 'num_steps'
  | 'cfg_scale_text'
  | 'cfg_scale_speaker'
  | 'speaker_kv_scale'
  | 'truncation_factor'
  | 'seed'

/**
 * 各フィールドのバリデーション範囲（integer かどうかも含む）
 */
const FIELD_CONSTRAINTS: Record<
  ConfigField,
  { min?: number; max?: number; integer: boolean; label: string; updateKey: keyof SpeakerConfigUpdate }
> = {
  num_steps: { min: 1, max: 100, integer: true, label: 'サンプリングステップ数', updateKey: 'numSteps' },
  cfg_scale_text: { min: 0.01, integer: false, label: 'テキストCFGスケール', updateKey: 'cfgScaleText' },
  cfg_scale_speaker: { min: 0.01, integer: false, label: '話者CFGスケール', updateKey: 'cfgScaleSpeaker' },
  speaker_kv_scale: { min: 0.01, integer: false, label: '話者KVスケール', updateKey: 'speakerKvScale' },
  truncation_factor: {
    min: 0.01,
    max: 1.0,
    integer: false,
    label: 'ノイズ切り詰め係数',
    updateKey: 'truncationFactor'
  },
  seed: { integer: true, label: '乱数シード', updateKey: 'seed' }
}

/**
 * /speaker コマンドの定義
 */
export const speakerCommand = new SlashCommandBuilder()
  .setName('speaker')
  .setDescription('話者を設定します')
  .addSubcommand((subcommand) =>
    subcommand
      .setName('set')
      .setDescription('話者を設定します')
      .addStringOption((option) =>
        option.setName('name').setDescription('話者名').setRequired(true).setAutocomplete(true)
      )
  )
  .addSubcommand((subcommand) => subcommand.setName('clear').setDescription('話者設定をリセットします'))
  .addSubcommand((subcommand) =>
    subcommand
      .setName('config')
      .setDescription('話者ごとの詳細設定（未設定項目はLoRAデフォルトを使用）')
      .addStringOption((option) =>
        option
          .setName('setting')
          .setDescription('設定項目')
          .setRequired(true)
          .addChoices(
            { name: 'show - 現在の設定を表示', value: 'show' },
            { name: 'num_steps - サンプリングステップ数（1〜100）', value: 'num_steps' },
            { name: 'cfg_scale_text - テキストCFGスケール', value: 'cfg_scale_text' },
            { name: 'cfg_scale_speaker - 話者CFGスケール', value: 'cfg_scale_speaker' },
            { name: 'speaker_kv_scale - 話者KVスケール', value: 'speaker_kv_scale' },
            { name: 'truncation_factor - ノイズ切り詰め係数（0〜1）', value: 'truncation_factor' },
            { name: 'seed - 乱数シード（整数）', value: 'seed' },
            { name: 'reset - 設定をデフォルトに戻す', value: 'reset' }
          )
      )
      .addNumberOption((option) => option.setName('value').setDescription('設定する値').setRequired(false))
  )

/**
 * /speaker set のオートコンプリートハンドラー（話者名）
 */
export const handleSpeakerAutocomplete = async (interaction: AutocompleteInteraction): Promise<void> => {
  const speakers = await updateSpeakerCache()
  const focusedValue = interaction.options.getFocused().toLowerCase()

  const filtered = speakers.filter((s) => s.name.toLowerCase().includes(focusedValue)).slice(0, 25)

  await interaction.respond(
    filtered.map((s) => ({
      name: s.name,
      value: s.uuid
    }))
  )
}

/**
 * 設定値をバリデーションして更新する
 */
const applyConfigValue = async (
  interaction: ChatInputCommandInteraction,
  field: ConfigField,
  value: number | null
): Promise<void> => {
  const constraint = FIELD_CONSTRAINTS[field]

  if (value === null) {
    await interaction.reply({
      content: `${constraint.label}を設定するには value オプションが必要です`,
      flags: MessageFlags.Ephemeral
    })
    return
  }

  if (constraint.integer && !Number.isInteger(value)) {
    await interaction.reply({
      content: `${constraint.label}は整数で指定してください`,
      flags: MessageFlags.Ephemeral
    })
    return
  }

  if (constraint.min !== undefined && value < constraint.min) {
    await interaction.reply({
      content: `${constraint.label}は ${constraint.min} 以上で指定してください`,
      flags: MessageFlags.Ephemeral
    })
    return
  }

  if (constraint.max !== undefined && value > constraint.max) {
    await interaction.reply({
      content: `${constraint.label}は ${constraint.max} 以下で指定してください`,
      flags: MessageFlags.Ephemeral
    })
    return
  }

  try {
    const update: SpeakerConfigUpdate = { [constraint.updateKey]: value }
    await updateCurrentSpeakerConfig(interaction.user.id, update)
    await interaction.reply({
      content: `${constraint.label}を ${value} に設定しました`,
      flags: MessageFlags.Ephemeral
    })
  } catch (error) {
    console.error(`Failed to set ${field}:`, error)
    await interaction.reply({
      content: '設定に失敗しました',
      flags: MessageFlags.Ephemeral
    })
  }
}

/**
 * /speaker コマンドのハンドラー
 */
export const handleSpeakerCommand = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const subcommand = interaction.options.getSubcommand()

  // speaker config サブコマンドの処理
  if (subcommand === 'config') {
    const userId = interaction.user.id
    const setting = interaction.options.getString('setting', true)
    const value = interaction.options.getNumber('value')

    if (setting === 'show') {
      try {
        const speakerId = await getCurrentSpeakerId(userId)
        const speakerConfig = await getCurrentSpeakerConfig(userId)
        const speakers = await updateSpeakerCache()
        const speakerName = speakers.find((s) => s.uuid === speakerId)?.name ?? '(不明)'

        const display = (v: number | undefined): string => (v === undefined ? '(LoRAデフォルト)' : `${v}`)

        const embed = new EmbedBuilder()
          .setTitle('現在のTTS設定')
          .setColor(0x00ae86)
          .addFields(
            { name: '話者', value: `${speakerName}`, inline: false },
            { name: '話者UUID', value: `\`${speakerId}\``, inline: false },
            { name: 'num_steps', value: display(speakerConfig.numSteps), inline: true },
            { name: 'cfg_scale_text', value: display(speakerConfig.cfgScaleText), inline: true },
            { name: 'cfg_scale_speaker', value: display(speakerConfig.cfgScaleSpeaker), inline: true },
            { name: 'speaker_kv_scale', value: display(speakerConfig.speakerKvScale), inline: true },
            { name: 'truncation_factor', value: display(speakerConfig.truncationFactor), inline: true },
            { name: 'seed', value: display(speakerConfig.seed), inline: true }
          )

        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral })
      } catch (error) {
        console.error('Failed to get settings:', error)
        await interaction.reply({
          content: '設定の取得に失敗しました',
          flags: MessageFlags.Ephemeral
        })
      }
      return
    }

    if (setting === 'reset') {
      try {
        await deleteUserSettings(userId)
        await interaction.reply({
          content: '設定をデフォルトに戻しました',
          flags: MessageFlags.Ephemeral
        })
      } catch (error) {
        console.error('Failed to reset settings:', error)
        await interaction.reply({
          content: 'リセットに失敗しました',
          flags: MessageFlags.Ephemeral
        })
      }
      return
    }

    if (setting in FIELD_CONSTRAINTS) {
      await applyConfigValue(interaction, setting as ConfigField, value)
      return
    }

    await interaction.reply({
      content: '不明な設定項目です',
      flags: MessageFlags.Ephemeral
    })
    return
  }

  // 通常のサブコマンド処理
  switch (subcommand) {
    case 'clear': {
      try {
        await deleteUserSettings(interaction.user.id)
        await interaction.reply({
          content: '話者設定をリセットしました',
          flags: MessageFlags.Ephemeral
        })
      } catch (error) {
        console.error('Failed to clear speaker settings:', error)
        await interaction.reply({
          content: '設定のリセットに失敗しました',
          flags: MessageFlags.Ephemeral
        })
      }
      break
    }

    case 'set': {
      const speakerUuid = interaction.options.getString('name', true)

      try {
        const speakers = await updateSpeakerCache()
        const speaker = speakers.find((s) => s.uuid === speakerUuid)

        if (!speaker) {
          await interaction.reply({
            content: '指定された話者が見つかりませんでした',
            flags: MessageFlags.Ephemeral
          })
          return
        }

        await setCurrentSpeakerId(interaction.user.id, speaker.uuid)
        await interaction.reply({
          content: `話者を **${speaker.name}** に設定しました`,
          flags: MessageFlags.Ephemeral
        })
      } catch (error) {
        console.error('Failed to set speaker:', error)
        await interaction.reply({
          content: '話者の設定に失敗しました',
          flags: MessageFlags.Ephemeral
        })
      }
      break
    }
  }
}
