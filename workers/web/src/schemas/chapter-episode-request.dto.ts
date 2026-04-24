import { z } from 'zod'
import { StoryCharacterContextSchema } from './story-character-context.dto'

// Writer へ送るシナリオ情報を定義する。
const ChapterEpisodeScenarioSchema = z.object({
  title: z.string().trim().nonempty(),
  genres: z.array(z.string().trim().nonempty()).nonempty(),
  tone: z.string().trim().nonempty()
})

// Writer へ送る章情報を定義する。
const ChapterEpisodeChapterSchema = z.object({
  title: z.string().trim().nonempty(),
  synopsis: z.string().trim().nonempty()
})

// Writer へ送るキャスト情報を定義する。
const ChapterEpisodeCastSchema = z.object({
  alias: z.string().trim().nonempty(),
  character: StoryCharacterContextSchema
})

// Writer 実行時の POST body を定義する。
export const ChapterEpisodeRequestSchema = z.object({
  model: z.string().trim().nonempty(),
  scenario: ChapterEpisodeScenarioSchema,
  chapter: ChapterEpisodeChapterSchema,
  cast: z.array(ChapterEpisodeCastSchema).nonempty()
})

export type ChapterEpisodeRequest = z.infer<typeof ChapterEpisodeRequestSchema>
