import { z } from 'zod'
import { BeatDigestSchema, WorldTimeSchema } from './drama-state.dto'
import {
  BeliefStrengthSchema,
  CharacterStatusSchema,
  FirstPersonSchema,
  HonorificSchema,
  SceneKindSchema,
  SeasonSchema,
  SecondPersonSchema,
  TensionSchema,
  WeatherSchema
} from './enums.dto'

/**
 * Editor → Writer へ渡す 1 Beat ぶんの指示書。
 *
 * 構造の詳細は `docs/agent-protocol/messages.md §4.4 BeatSheet` を参照。
 * 1 BeatSheet = 1 Beat。Editor は前サイクルの吸収と併せて次の BeatSheet を組む。
 */

/** flashback Beat で過去のキャラ状態を上書きする差分（`Beat.sceneContext.characterOverrides[alias]`）。 */
export const CharacterOverrideSchema = z
  .object({
    status: CharacterStatusSchema.optional(),
    location: z.string().nullable().optional(),
    mood: z.string().optional()
  })
  .strict()

/** Beat 独自の時空を宣言する（flashback 用、realtime では省略）。 */
export const SceneContextSchema = z
  .object({
    worldTime: WorldTimeSchema,
    season: SeasonSchema,
    weather: WeatherSchema,
    location: z.string().nonempty(),
    characterOverrides: z.record(z.string().nonempty(), CharacterOverrideSchema).optional()
  })
  .strict()

export const BeatSchema = z
  .object({
    beatId: z.string().nonempty(),
    sceneKind: SceneKindSchema,
    goal: z.string().nonempty(),
    tension: TensionSchema,
    presentCharacters: z.string().nonempty().array().min(1),

    // realtime なら省略可（DramaState の時空を使う）、flashback なら必須
    sceneContext: SceneContextSchema.optional(),

    // flashback の視点主（任意。純ナレーション回想なら省略）
    flashbackViewpointAlias: z.string().nonempty().optional(),

    seed: z.number().int().optional()
  })
  .strict()

/** Writer に渡す話者スナップショットの 1 エントリ。 */
export const BeatSheetSpeakerSchema = z
  .object({
    uuid: z.uuid(),
    persona: z.string().nonempty(),
    speechStyle: z.string().nonempty(),
    firstPerson: FirstPersonSchema,
    secondPerson: SecondPersonSchema.optional(),
    defaultHonorific: HonorificSchema.optional(),
    addressOf: z.record(z.string().nonempty(), z.string().nonempty()).optional(),
    knownFactsSnapshot: z
      .object({
        content: z.string().nonempty(),
        beliefStrength: BeliefStrengthSchema
      })
      .strict()
      .array()
  })
  .strict()

/** 前 Beat 末尾の cue（台詞接続のため）。 */
export const PrecedingTailCueSchema = z
  .object({
    speaker: z.string().nonempty(),
    text: z.string().nonempty()
  })
  .strict()

/** Writer への制約（VDS-JSON 出力時の上限値）。 */
export const BeatConstraintsSchema = z
  .object({
    maxCueTextLength: z.number().int().positive(),
    maxBeatTextLength: z.number().int().positive(),
    maxCueCount: z.number().int().positive(),
    allowedPauseRange: z.tuple([z.number().nonnegative(), z.number().positive()])
  })
  .strict()

export const BeatSheetSchema = z
  .object({
    schemaVersion: z.literal(1),
    dramaId: z.string().nonempty(),

    beat: BeatSchema,

    // この Beat で使ってよい話者（alias → speaker info）。
    // Writer はこの範囲外の alias を使ってはならない。
    speakers: z.record(z.string().nonempty(), BeatSheetSpeakerSchema),

    // 直近 5〜10 Beat のあらすじ（時系列、古い→新しい順）
    recentBeats: BeatDigestSchema.array().max(10),

    // 前 Beat 末尾の cue 2〜3 個（台詞接続用、初回は省略）
    precedingTailCues: PrecedingTailCueSchema.array().max(5).optional(),

    constraints: BeatConstraintsSchema
  })
  .strict()
  .superRefine((sheet, ctx) => {
    // flashback なら sceneContext が必須
    if (sheet.beat.sceneKind === 'flashback' && sheet.beat.sceneContext === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['beat', 'sceneContext'],
        message: "sceneKind: 'flashback' の Beat は sceneContext を必ず指定する"
      })
    }

    // presentCharacters は speakers に含まれる alias のみ
    for (const [i, alias] of sheet.beat.presentCharacters.entries()) {
      if (!(alias in sheet.speakers)) {
        ctx.addIssue({
          code: 'custom',
          path: ['beat', 'presentCharacters', i],
          message: `alias '${alias}' が speakers に含まれていない`
        })
      }
    }

    // allowedPauseRange は [min, max] で min <= max
    const [min, max] = sheet.constraints.allowedPauseRange
    if (min > max) {
      ctx.addIssue({
        code: 'custom',
        path: ['constraints', 'allowedPauseRange'],
        message: 'allowedPauseRange は [min, max] で min <= max であること'
      })
    }
  })

export type CharacterOverride = z.infer<typeof CharacterOverrideSchema>
export type SceneContext = z.infer<typeof SceneContextSchema>
export type Beat = z.infer<typeof BeatSchema>
export type BeatSheetSpeaker = z.infer<typeof BeatSheetSpeakerSchema>
export type PrecedingTailCue = z.infer<typeof PrecedingTailCueSchema>
export type BeatConstraints = z.infer<typeof BeatConstraintsSchema>
export type BeatSheet = z.infer<typeof BeatSheetSchema>
