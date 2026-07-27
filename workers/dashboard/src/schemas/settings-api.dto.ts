import { SpeakerConfigSchema, SpeakerConfigUpdateSchema, UserSettingsSchema } from '@irodori-tts/shared/settings'
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
 * 話者一覧の1件（Irodori-TTS の `/speakers` を UI 向けに整形したもの）
 */
export const SpeakerSchema = z.object({
  uuid: z.string().nonempty(),
  name: z.string(),
  cv: z.string().nullable(),
  categoryLabel: z.string().nullable()
})

/**
 * 話者一覧
 */
export const SpeakerListSchema = z.array(SpeakerSchema)

export { SpeakerConfigSchema, SpeakerConfigUpdateSchema, UserSettingsSchema }

export type Me = z.infer<typeof MeSchema>
export type Speaker = z.infer<typeof SpeakerSchema>
