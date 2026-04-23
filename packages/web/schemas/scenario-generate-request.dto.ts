import { z } from 'zod'
import { LlmRequestModelSchema } from './llm-settings.dto'
import { ScenarioGenreSchema, ScenarioToneSchema, scenarioCharacterLimit } from './scenario.dto'
import { StoryCharacterContextSchema } from './story-character-context.dto'

// LLM 送信時に含めるキャラクター情報を定義する
export const ScenarioGenerateCharacterSchema = StoryCharacterContextSchema

// LLM 送信時に含めるプロット入力情報を定義する
export const ScenarioGeneratePlotSchema = z.object({
  title: z.string().trim().min(1, 'タイトルは必須です').max(60, 'タイトルは60文字以内で入力してください'),
  genres: z
    .array(ScenarioGenreSchema)
    .min(1, 'ジャンルを1つ以上選択してください')
    .max(3, 'ジャンルは3つまで選択できます'),
  tone: ScenarioToneSchema,
  promptNote: z.string().max(400, '補足メモは400文字以内で入力してください')
})

// エピソード生成前に確認する LLM 送信 JSON を定義する
export const ScenarioGenerateRequestSchema = z.object({
  model: LlmRequestModelSchema,
  plot: ScenarioGeneratePlotSchema,
  characters: z
    .array(ScenarioGenerateCharacterSchema)
    .max(scenarioCharacterLimit, `キャラクターは${scenarioCharacterLimit}人まで選択できます`)
})

export type ScenarioGenerateRequest = z.infer<typeof ScenarioGenerateRequestSchema>
