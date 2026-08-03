import {
  GuildSettingsSchema,
  SpeakerConfigSchema,
  SpeakerConfigUpdateSchema,
  UserSettingsSchema
} from '@irodori-tts/shared/settings'
import { z } from 'zod'

/**
 * ログイン中ユーザーの情報
 */
export const MeSchema = z.object({
  id: z.string().nonempty(),
  username: z.string(),
  globalName: z.string().nullable(),
  avatar: z.string().nullable()
})

/**
 * 現在の話者を切り替えるリクエスト
 */
export const CurrentSpeakerInputSchema = z.object({
  currentId: z.string().nonempty()
})

/**
 * 話者に焼き込まれたサンプリングのデフォルト値
 *
 * Irodori-TTS が LoRA ごとに持っている既定値で、ユーザーが未設定の項目に適用される。
 * 表示専用（UIでプレースホルダとして見せる）。
 */
export const SpeakerDefaultsSchema = z.object({
  numSteps: z.number().optional(),
  cfgScaleText: z.number().optional(),
  cfgScaleSpeaker: z.number().optional(),
  speakerKvScale: z.number().optional(),
  truncationFactor: z.number().optional(),
  seed: z.number().optional()
})

/**
 * 話者一覧の1件（Irodori-TTS の `/speakers` を UI 向けに整形したもの）
 */
export const SpeakerSchema = z.object({
  uuid: z.string().nonempty(),
  name: z.string(),
  cv: z.string().nullable(),
  categoryLabel: z.string().nullable(),
  defaults: SpeakerDefaultsSchema
})

/**
 * 話者一覧
 */
export const SpeakerListSchema = z.array(SpeakerSchema)

/**
 * 設定を変更できるギルド1件
 */
export const GuildSummarySchema = z.object({
  id: z.string().nonempty(),
  name: z.string(),
  icon: z.string().nullable(),
  canManage: z.boolean()
})

/**
 * ギルド一覧
 */
export const GuildSummaryListSchema = z.array(GuildSummarySchema)

/**
 * 読み上げ対象に指定できるチャンネル1件
 */
export const GuildChannelSchema = z.object({
  id: z.string().nonempty(),
  name: z.string(),
  type: z.number().int(),
  position: z.number().int().optional()
})

/**
 * チャンネル一覧
 */
export const GuildChannelListSchema = z.array(GuildChannelSchema)

export { GuildSettingsSchema, SpeakerConfigSchema, SpeakerConfigUpdateSchema, UserSettingsSchema }

export type Me = z.infer<typeof MeSchema>
export type Speaker = z.infer<typeof SpeakerSchema>
export type SpeakerDefaults = z.infer<typeof SpeakerDefaultsSchema>
export type GuildSummary = z.infer<typeof GuildSummarySchema>
export type GuildChannel = z.infer<typeof GuildChannelSchema>
