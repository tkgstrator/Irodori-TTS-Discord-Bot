import { z } from 'zod'

// 登場キャラクターの最大選択数を定義する
export const scenarioCharacterLimit = 5

// プロット作成フォームで選択可能なジャンルを定義する
export const ScenarioGenreValues = [
  '学園',
  '恋愛',
  'ファンタジー',
  'ミステリー',
  'SF',
  '歴史',
  'サスペンス',
  '日常'
] as const

// プロット作成フォームで選択可能なトーンを定義する
export const ScenarioToneValues = [
  '軽快',
  'ユーモラス',
  '前向き',
  '幻想的',
  'ほろ苦い',
  'メランコリック',
  'シリアス',
  '緊迫',
  'ダーク'
] as const

// ジャンルの入力値を検証する
export const ScenarioGenreSchema = z.enum(ScenarioGenreValues)

// トーンの入力値を検証する
export const ScenarioToneSchema = z.enum(ScenarioToneValues)

// プロット作成フォームの入力値を検証する
export const ScenarioCreateFormSchema = z.object({
  title: z.string().trim().nonempty('タイトルは必須です').max(60, 'タイトルは60文字以内で入力してください'),
  genres: z
    .array(ScenarioGenreSchema)
    .nonempty('ジャンルを1つ以上選択してください')
    .max(3, 'ジャンルは3つまで選択できます'),
  tone: ScenarioToneSchema,
  plotCharacterIds: z
    .array(z.string().uuid())
    .max(scenarioCharacterLimit, `キャラクターは${scenarioCharacterLimit}人まで選択できます`),
  promptNote: z.string().max(400, '補足メモは400文字以内で入力してください')
})

export type ScenarioCreateFormValues = z.infer<typeof ScenarioCreateFormSchema>
