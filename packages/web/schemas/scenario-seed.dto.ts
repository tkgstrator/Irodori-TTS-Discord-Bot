import { z } from 'zod'
import { CharacterInputSchema } from './character.dto'

// シナリオ seed で扱うステータスを定義する
export const ScenarioSeedStatusSchema = z.enum(['draft', 'generating', 'completed', 'failed'])

// シナリオ cast の seed 形式を定義する
export const ScenarioSeedCastSchema = z
  .object({
    alias: z.string().min(1),
    characterId: z.uuid(),
    role: z.string().min(1),
    relationship: z.string().min(1)
  })
  .strict()

// シナリオ本体の seed 形式を定義する
export const ScenarioSeedScenarioSchema = z
  .object({
    id: z.uuid(),
    title: z.string().min(1),
    genres: z.array(z.string().min(1)).min(1),
    tone: z.string().min(1),
    ending: z.string().min(1),
    status: ScenarioSeedStatusSchema,
    narratorId: z.uuid().nullable(),
    vdsJson: z.null(),
    cast: z.array(ScenarioSeedCastSchema)
  })
  .strict()
  .superRefine((value, ctx) => {
    const aliasSet = new Set(value.cast.map((cast) => cast.alias))
    const characterSet = new Set(value.cast.map((cast) => cast.characterId))

    if (aliasSet.size !== value.cast.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['cast'],
        message: 'Scenario cast aliases must be unique.'
      })
    }

    if (characterSet.size !== value.cast.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['cast'],
        message: 'Scenario cast character ids must be unique.'
      })
    }

    if (value.narratorId !== null && !characterSet.has(value.narratorId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['narratorId'],
        message: 'Scenario narrator must be included in cast.'
      })
    }
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
    characters: z.array(ScenarioSeedCharacterSchema).min(1),
    scenarios: z.array(ScenarioSeedScenarioSchema).min(1)
  })
  .strict()
  .superRefine((value, ctx) => {
    const characterIds = new Set(value.characters.map((character) => character.id))

    value.scenarios.forEach((scenario, scenarioIndex) => {
      scenario.cast.forEach((cast, castIndex) => {
        if (!characterIds.has(cast.characterId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['scenarios', scenarioIndex, 'cast', castIndex, 'characterId'],
            message: 'Scenario cast must reference an existing character.'
          })
        }
      })

      if (scenario.narratorId !== null && !characterIds.has(scenario.narratorId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['scenarios', scenarioIndex, 'narratorId'],
          message: 'Scenario narrator must reference an existing character.'
        })
      }
    })
  })

export type ScenarioSeedStatus = z.infer<typeof ScenarioSeedStatusSchema>
export type ScenarioSeedCast = z.infer<typeof ScenarioSeedCastSchema>
export type ScenarioSeedScenario = z.infer<typeof ScenarioSeedScenarioSchema>
export type ScenarioSeedCharacter = z.infer<typeof ScenarioSeedCharacterSchema>
export type ScenarioSeedSet = z.infer<typeof ScenarioSeedSetSchema>
