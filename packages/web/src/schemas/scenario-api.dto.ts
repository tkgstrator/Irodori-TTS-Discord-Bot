import { z } from 'zod'
import { GeminiModelSchema } from './llm-settings.dto'

// シナリオ API のステータス値を定義する
const ScenarioApiStatusSchema = z.enum(['draft', 'generating', 'failed', 'completed'])

// 章 API のステータス値を定義する
const ScenarioApiChapterStatusSchema = z.enum(['draft', 'generating', 'failed', 'completed'])

// 章内の話者表示情報を定義する
const ScenarioApiSpeakerSchema = z.object({
  alias: z.string().nonempty(),
  name: z.string().nonempty(),
  speakerId: z.string().uuid().nullable(),
  caption: z.string().nullable(),
  initial: z.string().nonempty(),
  imageUrl: z.string().nullable().optional(),
  colorClass: z.string().nonempty(),
  nameColor: z.string().nonempty()
})

// 章で使うキャラクター参照情報を定義する
const ScenarioApiChapterCharacterSchema = z.object({
  name: z.string().nonempty(),
  imageUrl: z.string().nullable(),
  speakerId: z.string().uuid().nullable()
})

// 章内のセリフ cue を定義する
const ScenarioApiSpeechCueSchema = z.object({
  kind: z.literal('speech'),
  speaker: z.string().nonempty(),
  text: z.string().nonempty()
})

// 章内の pause cue を定義する
const ScenarioApiPauseCueSchema = z.object({
  kind: z.literal('pause'),
  duration: z.number().positive()
})

// 章内の scene cue を定義する
const ScenarioApiSceneCueSchema = z.object({
  kind: z.literal('scene'),
  name: z.string().nonempty()
})

// 章内 cue の union を定義する
const ScenarioApiCueSchema = z.discriminatedUnion('kind', [
  ScenarioApiSpeechCueSchema,
  ScenarioApiPauseCueSchema,
  ScenarioApiSceneCueSchema
])

// 章レスポンスを定義する
const ScenarioApiChapterSchema = z.object({
  id: z.string().nonempty(),
  number: z.number().int().positive(),
  title: z.string().nonempty(),
  status: ScenarioApiChapterStatusSchema,
  cueCount: z.number().int().nonnegative(),
  durationMinutes: z.number().nonnegative(),
  synopsis: z.string(),
  generationError: z.string().nullable(),
  characters: z.array(ScenarioApiChapterCharacterSchema),
  cues: z.array(ScenarioApiCueSchema)
})

// シナリオ一覧・詳細レスポンスを定義する
export const ScenarioApiSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nonempty(),
  status: ScenarioApiStatusSchema,
  genres: z.array(z.string().nonempty()),
  tone: z.string().nonempty(),
  promptNote: z.string(),
  editorModel: GeminiModelSchema,
  writerModel: GeminiModelSchema,
  plotCharacters: z.array(z.string().nonempty()),
  cueCount: z.number().int().nonnegative(),
  speakerCount: z.number().int().nonnegative(),
  durationMinutes: z.number().nonnegative().nullable(),
  isAiGenerated: z.boolean(),
  updatedAt: z.string().nonempty(),
  speakers: z.array(ScenarioApiSpeakerSchema),
  chapters: z.array(ScenarioApiChapterSchema)
})

// シナリオ一覧レスポンスを定義する
export const ScenarioApiListSchema = z.array(ScenarioApiSchema)

export type ScenarioApi = z.infer<typeof ScenarioApiSchema>
export type ScenarioApiSpeaker = z.infer<typeof ScenarioApiSpeakerSchema>
export type ScenarioApiChapter = z.infer<typeof ScenarioApiChapterSchema>
