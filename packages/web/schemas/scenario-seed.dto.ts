import { z } from 'zod'
import { CharacterInputSchema } from './character.dto'

// シナリオ seed で扱うステータスを定義する
export const ScenarioSeedStatusSchema = z.enum(['draft', 'generating', 'completed', 'failed'])

// 章 seed で扱うステータスを定義する
export const ScenarioSeedChapterStatusSchema = z.enum(['draft', 'generating', 'completed'])

// シナリオ cast の seed 形式を定義する
export const ScenarioSeedCastSchema = z
  .object({
    alias: z.string().nonempty(),
    speakerId: z.uuid(),
    role: z.string().nonempty(),
    relationship: z.string().nonempty()
  })
  .strict()

// 章内の speech cue seed を定義する
export const ScenarioSeedSpeechCueSchema = z
  .object({
    kind: z.literal('speech'),
    speaker: z.string().nonempty(),
    text: z.string().nonempty()
  })
  .strict()

// 章内の pause cue seed を定義する
export const ScenarioSeedPauseCueSchema = z
  .object({
    kind: z.literal('pause'),
    duration: z.number().positive()
  })
  .strict()

// 章内 cue seed を定義する
export const ScenarioSeedCueSchema = z.discriminatedUnion('kind', [
  ScenarioSeedSpeechCueSchema,
  ScenarioSeedPauseCueSchema
])

// シナリオ章 seed 形式を定義する
export const ScenarioSeedChapterSchema = z
  .object({
    id: z.string().nonempty(),
    number: z.number().int().positive(),
    title: z.string().nonempty(),
    status: ScenarioSeedChapterStatusSchema,
    durationMinutes: z.number().nonnegative(),
    synopsis: z.string(),
    characters: z.array(z.string().nonempty()),
    cues: z.array(ScenarioSeedCueSchema)
  })
  .strict()
  .superRefine((value, ctx) => {
    const speakerSet = new Set(value.characters)

    value.cues.forEach((cue, index) => {
      if (cue.kind === 'speech' && !speakerSet.has(cue.speaker)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cues', index, 'speaker'],
          message: 'Chapter cue speaker must be included in chapter characters.'
        })
      }
    })
  })

// シナリオ本体の seed 形式を定義する
export const ScenarioSeedScenarioSchema = z
  .object({
    id: z.uuid(),
    title: z.string().nonempty(),
    genres: z.array(z.string().nonempty()).nonempty(),
    tone: z.string().nonempty(),
    ending: z.string().nonempty(),
    status: ScenarioSeedStatusSchema,
    narratorSpeakerId: z.uuid().nullable(),
    vdsJson: z.null(),
    cast: z.array(ScenarioSeedCastSchema),
    chapters: z.array(ScenarioSeedChapterSchema)
  })
  .strict()
  .superRefine((value, ctx) => {
    const aliasSet = new Set(value.cast.map((cast) => cast.alias))
    const speakerSet = new Set(value.cast.map((cast) => cast.speakerId))

    if (aliasSet.size !== value.cast.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['cast'],
        message: 'Scenario cast aliases must be unique.'
      })
    }

    if (speakerSet.size !== value.cast.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['cast'],
        message: 'Scenario cast speaker ids must be unique.'
      })
    }

    if (value.narratorSpeakerId !== null && !speakerSet.has(value.narratorSpeakerId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['narratorSpeakerId'],
        message: 'Scenario narrator must be included in cast.'
      })
    }

    value.chapters.forEach((chapter, chapterIndex) => {
      chapter.characters.forEach((alias, aliasIndex) => {
        if (!aliasSet.has(alias)) {
          ctx.addIssue({
            code: 'custom',
            path: ['chapters', chapterIndex, 'characters', aliasIndex],
            message: 'Chapter character alias must be defined in scenario cast.'
          })
        }
      })
    })
  })

// シナリオ関連キャラクターの seed 形式を定義する
export const ScenarioSeedCharacterSchema = z
  .object({
    id: z.uuid(),
    data: CharacterInputSchema
  })
  .strict()

// シナリオ管理ページ全体の seed 形式を定義する
export const ScenarioSeedSetSchema = z
  .object({
    characters: z.array(ScenarioSeedCharacterSchema),
    scenarios: z.array(ScenarioSeedScenarioSchema).nonempty()
  })
  .strict()

export type ScenarioSeedStatus = z.infer<typeof ScenarioSeedStatusSchema>
export type ScenarioSeedChapterStatus = z.infer<typeof ScenarioSeedChapterStatusSchema>
export type ScenarioSeedCast = z.infer<typeof ScenarioSeedCastSchema>
export type ScenarioSeedSpeechCue = z.infer<typeof ScenarioSeedSpeechCueSchema>
export type ScenarioSeedPauseCue = z.infer<typeof ScenarioSeedPauseCueSchema>
export type ScenarioSeedCue = z.infer<typeof ScenarioSeedCueSchema>
export type ScenarioSeedChapter = z.infer<typeof ScenarioSeedChapterSchema>
export type ScenarioSeedScenario = z.infer<typeof ScenarioSeedScenarioSchema>
export type ScenarioSeedCharacter = z.infer<typeof ScenarioSeedCharacterSchema>
export type ScenarioSeedSet = z.infer<typeof ScenarioSeedSetSchema>
