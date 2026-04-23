import { z } from 'zod'
import { ChapterDigestSchema } from './chapter-digest.dto'
import { ChapterGenerateModeSchema } from './chapter-generate-request.dto'
import { LlmRequestModelSchema } from './llm-settings.dto'
import { ScenarioGenreSchema, ScenarioToneSchema } from './scenario.dto'
import { StoryCharacterContextSchema } from './story-character-context.dto'

// 章計画時に参照するシナリオの固定情報を定義する。
export const ChapterPlanRequestScenarioSchema = z.object({
  title: z.string().trim().min(1),
  genres: z.array(ScenarioGenreSchema).min(1),
  tone: ScenarioToneSchema
})

// v1 の章計画入力を定義する。
// cast / alias 編集は未対応のため、character id ベースでフォーカス対象を渡す。
export const ChapterPlanRequestInputSchema = z.object({
  mode: ChapterGenerateModeSchema,
  nextChapterNumber: z.number().int().positive(),
  requestedTitle: z.string().trim().max(60, '章タイトルは60文字以内で入力してください'),
  promptNote: z.string().max(400, '流れメモは400文字以内で入力してください'),
  focusCharacterIds: z.array(z.string().uuid()).max(10, '登場人物は10人まで選択できます')
})

// Editor へ送る章計画リクエストを定義する。
export const ChapterPlanRequestSchema = z.object({
  schemaVersion: z.literal(1),
  dramaId: z.string().uuid(),
  model: LlmRequestModelSchema,
  scenario: ChapterPlanRequestScenarioSchema,
  characters: z.array(StoryCharacterContextSchema).min(1, '章設計には登場人物が必要です'),
  completedChapters: z.array(ChapterDigestSchema),
  request: ChapterPlanRequestInputSchema
})

export type ChapterPlanRequest = z.infer<typeof ChapterPlanRequestSchema>
