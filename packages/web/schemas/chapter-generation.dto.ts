import { z } from 'zod'

// 章生成ダイアログの入力値を検証する。
export const ChapterGenerateFormSchema = z.object({
  title: z.string().trim().max(60, '章タイトルは60文字以内で入力してください'),
  promptNote: z.string().max(400, '流れメモは400文字以内で入力してください'),
  characterNames: z.array(z.string().trim().min(1)).max(10, '登場人物は10人まで選択できます')
})

export type ChapterGenerateFormValues = z.infer<typeof ChapterGenerateFormSchema>
