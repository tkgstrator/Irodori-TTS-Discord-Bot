import { z } from 'zod'
import { ScenarioRatingSchema, ScenarioToneSchema } from './scenario.dto'

// 章生成ダイアログの入力値を検証する。
export const ChapterGenerateFormSchema = z.object({
  title: z.string().trim().nonempty('章タイトルは必須です').max(60, '章タイトルは60文字以内で入力してください'),
  promptNote: z.string().trim().nonempty('流れメモは必須です').max(400, '流れメモは400文字以内で入力してください'),
  characterNames: z.array(z.string().trim().nonempty()).max(10, '登場人物は10人まで選択できます'),
  rating: ScenarioRatingSchema,
  tone: ScenarioToneSchema
})

export type ChapterGenerateFormValues = z.infer<typeof ChapterGenerateFormSchema>
