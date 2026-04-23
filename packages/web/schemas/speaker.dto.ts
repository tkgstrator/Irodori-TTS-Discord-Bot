import { z } from 'zod'
import { CharacterFormSchema, SpeakerLinkSchema } from './character.dto'

// 話者 API の識別子形式を定義する
export const SpeakerIdSchema = z.string().uuid()

// 話者取り込み時にフォームへ反映する値を定義する
export const SpeakerImportValuesSchema = CharacterFormSchema.omit({
  name: true,
  speakerId: true
})

// 話者一覧用のレスポンス要素を定義する
export const SpeakerImportItemSchema = z.object({
  speakerId: SpeakerIdSchema,
  name: z.string().nonempty()
})

// 話者一覧レスポンスの形式を定義する
export const SpeakerImportListSchema = z.array(SpeakerImportItemSchema)

// 話者テンプレートレスポンスの形式を定義する
export const SpeakerImportTemplateSchema = z.object({
  speaker: SpeakerLinkSchema,
  values: SpeakerImportValuesSchema
})

export type SpeakerImportItem = z.infer<typeof SpeakerImportItemSchema>
export type SpeakerImportValues = z.infer<typeof SpeakerImportValuesSchema>
export type SpeakerImportTemplate = z.infer<typeof SpeakerImportTemplateSchema>
