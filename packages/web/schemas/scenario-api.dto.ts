import { z } from 'zod'

// シナリオ API のステータス値を定義する
export const ScenarioApiStatusSchema = z.enum(['draft', 'generating', 'completed'])

// 章 API のステータス値を定義する
export const ScenarioApiChapterStatusSchema = z.enum(['draft', 'generating', 'completed'])

// 章内の話者表示情報を定義する
export const ScenarioApiSpeakerSchema = z.object({
  alias: z.string().min(1),
  name: z.string().min(1),
  speakerId: z.string().uuid().nullable(),
  initial: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
  colorClass: z.string().min(1),
  nameColor: z.string().min(1)
})

// 章で使うキャラクター参照情報を定義する
export const ScenarioApiChapterCharacterSchema = z.object({
  name: z.string().min(1),
  imageUrl: z.string().nullable(),
  speakerId: z.string().uuid().nullable()
})

// 章内のセリフ cue を定義する
export const ScenarioApiSpeechCueSchema = z.object({
  kind: z.literal('speech'),
  speaker: z.string().min(1),
  text: z.string().min(1)
})

// 章内の pause cue を定義する
export const ScenarioApiPauseCueSchema = z.object({
  kind: z.literal('pause'),
  duration: z.number().positive()
})

// 章内 cue の union を定義する
export const ScenarioApiCueSchema = z.discriminatedUnion('kind', [
  ScenarioApiSpeechCueSchema,
  ScenarioApiPauseCueSchema
])

// 章レスポンスを定義する
export const ScenarioApiChapterSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  status: ScenarioApiChapterStatusSchema,
  cueCount: z.number().int().nonnegative(),
  durationMinutes: z.number().nonnegative(),
  synopsis: z.string(),
  characters: z.array(ScenarioApiChapterCharacterSchema),
  cues: z.array(ScenarioApiCueSchema)
})

// シナリオ一覧・詳細レスポンスを定義する
export const ScenarioApiSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  status: ScenarioApiStatusSchema,
  genres: z.array(z.string().min(1)),
  tone: z.string().min(1),
  plotCharacters: z.array(z.string().min(1)),
  cueCount: z.number().int().nonnegative(),
  speakerCount: z.number().int().nonnegative(),
  durationMinutes: z.number().nonnegative().nullable(),
  isAiGenerated: z.boolean(),
  updatedAt: z.string().min(1),
  speakers: z.array(ScenarioApiSpeakerSchema),
  chapters: z.array(ScenarioApiChapterSchema)
})

// シナリオ一覧レスポンスを定義する
export const ScenarioApiListSchema = z.array(ScenarioApiSchema)

export type ScenarioApi = z.infer<typeof ScenarioApiSchema>
export type ScenarioApiList = z.infer<typeof ScenarioApiListSchema>
export type ScenarioApiSpeaker = z.infer<typeof ScenarioApiSpeakerSchema>
export type ScenarioApiChapter = z.infer<typeof ScenarioApiChapterSchema>
