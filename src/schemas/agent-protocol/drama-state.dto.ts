import { z } from 'zod'
import {
  BeliefStrengthSchema,
  CharacterStatusSchema,
  FactSourceSchema,
  SceneKindSchema,
  SeasonSchema,
  WeatherSchema
} from './enums.dto'

/**
 * リアルタイム進行の状態。Editor の吸収で更新される。
 *
 * 構造の詳細は `docs/agent-protocol/messages.md §4.3 DramaState` を参照。
 * `flashback` の Beat は DramaState を一切更新しない。
 */

/** 物語内時刻。`hhmm` は "HH:mm" 形式（"08:10" / "22:14" 等）。 */
export const WorldTimeSchema = z
  .object({
    day: z.number().int().nonnegative(),
    hhmm: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  })
  .strict()

/** 事実参照（`DramaBible.facts` のキーを引く）。 */
export const FactRefSchema = z
  .object({
    factId: z.string().nonempty(),
    acquiredInBeatId: z.string().nonempty(),
    source: FactSourceSchema,
    beliefStrength: BeliefStrengthSchema
  })
  .strict()

/** Beat のダイジェスト。`DramaState.recentBeats` と `BeatSheet.recentBeats` で共用。 */
export const BeatDigestSchema = z
  .object({
    beatId: z.string().nonempty(),
    sceneKind: SceneKindSchema,
    summary: z.string().nonempty(),
    playedAt: z.iso.datetime()
  })
  .strict()

/** キャラの状態エントリ（`DramaState.characterStates[alias]`）。 */
export const CharacterStateSchema = z
  .object({
    // ハード制約
    status: CharacterStatusSchema,
    location: z.string().nullable(),
    lastSeenBeatId: z.string().nonempty(),

    // ソフト記述・知識
    mood: z.string(),
    knownFacts: FactRefSchema.array(),
    inventory: z.string().array().optional()
  })
  .strict()

export const DramaStateSchema = z
  .object({
    schemaVersion: z.literal(1),
    dramaId: z.string().nonempty(),

    // ハード制約
    worldTime: WorldTimeSchema,
    season: SeasonSchema,
    weather: WeatherSchema,
    location: z.string().nonempty(),
    characterStates: z.record(z.string().nonempty(), CharacterStateSchema),

    // 進行
    recentBeats: BeatDigestSchema.array().max(8),
    totalPlayedSec: z.number().nonnegative(),
    nextBeatIdCounter: z.number().int().nonnegative()
  })
  .strict()

export type WorldTime = z.infer<typeof WorldTimeSchema>
export type FactRef = z.infer<typeof FactRefSchema>
export type BeatDigest = z.infer<typeof BeatDigestSchema>
export type CharacterState = z.infer<typeof CharacterStateSchema>
export type DramaState = z.infer<typeof DramaStateSchema>
