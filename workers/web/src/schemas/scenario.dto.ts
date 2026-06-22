import { z } from 'zod'
import { LlmModelSchema } from './llm-settings.dto'

// 登場キャラクターの最大選択数を定義する
export const scenarioCharacterLimit = 5

// プロット作成フォームで選択可能なジャンルを定義する
export const ScenarioGenreValues = [
  '学園',
  '恋愛',
  '百合',
  'BL',
  'ハーレム',
  'ラブコメ',
  'ファンタジー',
  '異世界',
  '転生',
  'SF',
  'ミステリー',
  'サスペンス',
  'ホラー',
  'アクション',
  'バトル',
  '冒険',
  '歴史',
  '時代劇',
  '日常',
  'ほのぼの',
  'コメディ',
  '群像劇',
  'お仕事',
  'スポーツ',
  '音楽',
  '青春',
  '悲恋',
  'NTR',
  '逆ハーレム',
  'ディストピア',
  'サイバーパンク',
  'ダークファンタジー',
  'ポストアポカリプス',
  '純文学',
  'エッセイ風'
] as const

// プロット作成フォームで選択可能なトーンを定義する
export const ScenarioToneValues = [
  '軽快',
  'ユーモラス',
  'コミカル',
  '前向き',
  'ほのぼの',
  '癒し',
  '爽やか',
  'ロマンティック',
  '甘酸っぱい',
  '幻想的',
  '神秘的',
  'ほろ苦い',
  'メランコリック',
  '感傷的',
  'シリアス',
  '重厚',
  '緊迫',
  'スリリング',
  'ダーク',
  'ホラー',
  '退廃的',
  'エモーショナル',
  '壮大',
  'ノスタルジック'
] as const

// プロット作成フォームで選択可能なレーティングを定義する
export const ScenarioRatingValues = ['全年齢', 'R-15', 'R-18'] as const

// ジャンルの入力値を検証する
export const ScenarioGenreSchema = z.enum(ScenarioGenreValues)

// トーンの入力値を検証する
export const ScenarioToneSchema = z.enum(ScenarioToneValues)

// レーティングの入力値を検証する
export const ScenarioRatingSchema = z.enum(ScenarioRatingValues)

// プロット作成フォームの入力値を検証する
export const ScenarioCreateFormSchema = z.object({
  title: z.string().trim().nonempty('タイトルは必須です').max(60, 'タイトルは60文字以内で入力してください'),
  genres: z
    .array(ScenarioGenreSchema)
    .nonempty('ジャンルを1つ以上選択してください')
    .max(3, 'ジャンルは3つまで選択できます'),
  tone: ScenarioToneSchema,
  rating: ScenarioRatingSchema,
  editorModel: LlmModelSchema,
  writerModel: LlmModelSchema,
  plotCharacterIds: z
    .array(z.string().uuid())
    .max(scenarioCharacterLimit, `キャラクターは${scenarioCharacterLimit}人まで選択できます`),
  promptNote: z.string().max(400, '補足メモは400文字以内で入力してください')
})

export type ScenarioCreateFormValues = z.infer<typeof ScenarioCreateFormSchema>
