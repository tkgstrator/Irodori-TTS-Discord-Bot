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
