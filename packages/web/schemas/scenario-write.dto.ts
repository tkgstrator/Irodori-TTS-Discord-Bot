import { z } from 'zod'
import { ScenarioGenreSchema, ScenarioToneSchema, scenarioCharacterLimit } from './scenario.dto'

// シナリオ作成 API の入力を定義する。
export const ScenarioCreateApiSchema = z.object({
  title: z.string().trim().nonempty('タイトルは必須です').max(60, 'タイトルは60文字以内で入力してください'),
  genres: z
    .array(ScenarioGenreSchema)
    .nonempty('ジャンルを1つ以上選択してください')
    .max(3, 'ジャンルは3つまで選択できます'),
  tone: ScenarioToneSchema,
  characterIds: z
    .array(z.string().uuid())
    .max(scenarioCharacterLimit, `キャラクターは${scenarioCharacterLimit}人まで選択できます`)
})

// シナリオ更新 API の入力を定義する。
export const ScenarioUpdateApiSchema = ScenarioCreateApiSchema

// 章追加 API の入力を定義する。
export const ScenarioAppendChapterApiSchema = z.object({
  title: z.string().trim().max(60, '章タイトルは60文字以内で入力してください'),
  synopsis: z.string().trim().max(400, '章要約は400文字以内で入力してください'),
  characterIds: z.array(z.string().uuid()).max(10, '登場人物は10人まで選択できます')
})

export type ScenarioCreateApiInput = z.infer<typeof ScenarioCreateApiSchema>
export type ScenarioUpdateApiInput = z.infer<typeof ScenarioUpdateApiSchema>
export type ScenarioAppendChapterApiInput = z.infer<typeof ScenarioAppendChapterApiSchema>
