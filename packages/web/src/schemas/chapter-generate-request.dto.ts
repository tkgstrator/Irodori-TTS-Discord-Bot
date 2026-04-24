import { z } from 'zod'
import { ChapterGenerateFormSchema } from './chapter-generation.dto'
import { LlmRequestModelSchema } from './llm-settings.dto'

// 章生成時に送るシナリオ情報を定義する
const ChapterGenerateScenarioSchema = z.object({
  id: z.string().nonempty(),
  title: z.string().nonempty(),
  genres: z.array(z.string().nonempty()),
  tone: z.string().nonempty(),
  plotCharacters: z.array(z.string().nonempty())
})

// 章生成の実行モードを定義する
export const ChapterGenerateModeSchema = z.enum(['auto', 'manual'])

// 章生成時に送る章入力情報を定義する
const ChapterGenerateRequestChapterSchema = z.object({
  mode: ChapterGenerateModeSchema,
  number: z.number().int().positive(),
  resolvedTitle: z.string().nonempty(),
  input: ChapterGenerateFormSchema
})

// 章生成前に確認する LLM 送信 JSON を定義する
export const ChapterGenerateRequestSchema = z.object({
  model: LlmRequestModelSchema,
  scenario: ChapterGenerateScenarioSchema,
  chapter: ChapterGenerateRequestChapterSchema
})

export type ChapterGenerateMode = z.infer<typeof ChapterGenerateModeSchema>
