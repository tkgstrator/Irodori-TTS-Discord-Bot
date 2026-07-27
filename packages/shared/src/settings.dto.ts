import { z } from 'zod'

/**
 * 話者ごとの詳細設定のスキーマ
 *
 * Irodori-TTS の `POST /synth` に渡すサンプリングパラメータのうち、
 * ユーザーが上書き可能なものを保持する。未設定のフィールドは
 * サーバー側の LoRA デフォルト → 組み込みデフォルト にフォールバックする。
 */
export const SpeakerConfigSchema = z.object({
  /** Rectified-flow のサンプリングステップ数（1〜100、未設定でLoRAデフォルト） */
  numSteps: z.number().int().min(1).max(100).optional(),
  /** テキスト条件付けへのCFGスケール（0より大、未設定でLoRAデフォルト） */
  cfgScaleText: z.number().positive().optional(),
  /** 話者条件付けへのCFGスケール（0より大、未設定でLoRAデフォルト） */
  cfgScaleSpeaker: z.number().positive().optional(),
  /** 話者ストリーム向けKVキャッシュスケール（0より大、未設定で無効） */
  speakerKvScale: z.number().positive().optional(),
  /** ノイズ切り詰め係数（0より大1以下、未設定で無効） */
  truncationFactor: z.number().positive().max(1).optional(),
  /** 再現用乱数シード（未設定でランダム） */
  seed: z.number().int().optional()
})

/**
 * 話者設定の部分更新用のスキーマ
 */
export const SpeakerConfigUpdateSchema = SpeakerConfigSchema.partial()

/**
 * ユーザー設定のスキーマ定義
 *
 * Irodori-TTS の話者IDはUUID文字列のため、
 * `currentId` および `settings` のキーは文字列で保持する。
 */
export const UserSettingsSchema = z.object({
  speaker: z.object({
    currentId: z.string().nonempty(),
    settings: z.record(z.string(), SpeakerConfigSchema).default({})
  })
})

/**
 * ギルド設定のスキーマ定義
 */
export const GuildSettingsSchema = z.object({
  /** VCに参加していないユーザーのチャットを読み上げるか */
  readNonVcUsers: z.boolean().default(true),
  /** ユーザーのVC参加時に「XXが参加しました」と読み上げるか */
  announceJoin: z.boolean().default(true),
  /** ユーザーのVC退出時に「XXが退席しました」と読み上げるか */
  announceLeave: z.boolean().default(true),
  /** 読み上げ対象のチャンネルIDリスト（空の場合は全チャンネル） */
  readChannels: z.array(z.string()).default([])
})

/**
 * ギルド辞書1エントリのスキーマ
 *
 * 単語にルビ記法の構成文字（`|`・`[`・`]`）や改行を含めると
 * 読み上げ前処理のルビ解決と衝突するため禁止する。
 */
export const GuildDictionaryEntrySchema = z.object({
  /** 置換対象の単語 */
  word: z
    .string()
    .min(1)
    .max(50)
    .refine((value) => !/[|[\]\n\r]/.test(value), {
      message: 'word must not contain |, [, ], or line breaks'
    }),
  /** 単語の読み */
  reading: z.string().min(1).max(100)
})

/**
 * ギルド辞書の最大エントリ数
 */
export const GUILD_DICTIONARY_MAX_ENTRIES = 500

/**
 * ユーザー設定のRedisキーを生成する
 * @param userId DiscordユーザーID
 */
export const userSettingsKey = (userId: string): string => `user:settings:${userId}`

/**
 * ギルド設定のRedisキーを生成する
 * @param guildId ギルドID
 */
export const guildSettingsKey = (guildId: string): string => `guild:${guildId}:settings`

/**
 * ギルド辞書のRedisキーを生成する（Hash: field=単語, value=読み）
 * @param guildId ギルドID
 */
export const guildDictionaryKey = (guildId: string): string => `guild:${guildId}:dictionary`

/**
 * Botが参加中のギルドID集合のRedisキー（Set）
 */
export const BOT_GUILDS_KEY = 'bot:guilds'

/**
 * 話者ごとの詳細設定の型
 */
export type SpeakerConfig = z.infer<typeof SpeakerConfigSchema>

/**
 * 話者設定の部分更新用の型
 */
export type SpeakerConfigUpdate = z.infer<typeof SpeakerConfigUpdateSchema>

/**
 * ユーザー設定の型
 */
export type UserSettings = z.infer<typeof UserSettingsSchema>

/**
 * ギルド設定の型
 */
export type GuildSettings = z.infer<typeof GuildSettingsSchema>

/**
 * ギルド設定の部分更新用の型
 */
export type GuildSettingsUpdate = Partial<GuildSettings>

/**
 * ギルド辞書1エントリの型
 */
export type GuildDictionaryEntry = z.infer<typeof GuildDictionaryEntrySchema>
