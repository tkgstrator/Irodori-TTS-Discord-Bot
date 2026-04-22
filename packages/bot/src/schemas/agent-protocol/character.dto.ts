import { z } from 'zod'
import {
  AgeGroupSchema,
  AttributeSchema,
  BackgroundSchema,
  FirstPersonSchema,
  GenderSchema,
  HonorificSchema,
  OccupationSchema,
  PersonalitySchema,
  RelationshipSchema,
  RoleSchema,
  SecondPersonSchema,
  SpeechStyleSchema
} from './enums.dto'

/**
 * キャラクター定義。User が `DramaBrief.cast.characters[]` に 1〜N 人並べる。
 *
 * 構造の詳細は `docs/agent-protocol/messages.md §4.1 CharacterSpec` を参照。
 * v1 では `race` フィールドを持たない（全員 human 固定）。
 *
 * 主人公と関係性の整合性（`role: 'protagonist'` ↔ `relationship: 'self'`、
 * 主人公は 1 ドラマに 1 人だけ等）は **`CharacterSpec` 単体では検証せず、
 * `DramaBrief` の superRefine で配列全体として検証する**。
 */

/** VDS-JSON の alias と同じ識別子規則（`docs/voice-drama-format.md §3.4`）。 */
export const ALIAS_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/

export const CharacterSpecSchema = z
  .object({
    name: z.string().nonempty(),
    alias: z.string().regex(ALIAS_PATTERN),
    uuid: z.uuid(),

    // 必須 enum
    role: RoleSchema,
    ageGroup: AgeGroupSchema,
    gender: GenderSchema,
    speechStyle: SpeechStyleSchema,
    firstPerson: FirstPersonSchema,

    // 必須 enum 配列（1〜4 個）
    personality: PersonalitySchema.array().min(1).max(4),

    // 主人公との関係
    relationship: RelationshipSchema,

    // 任意 enum
    occupation: OccupationSchema.optional(),
    attributes: AttributeSchema.array().max(4).optional(),
    background: BackgroundSchema.array().max(3).optional(),

    // 二人称代名詞（指定すると相手の名前を呼ばず代名詞で固定。例: 'kimi' → 常に「君」）。
    secondPerson: SecondPersonSchema.optional(),
    // 他キャラを呼ぶときの既定敬称（例: 'chan' で全員「◯◯ちゃん」）。
    // secondPerson が指定されていればそちらが優先され、これは使われない。
    defaultHonorific: HonorificSchema.optional(),
    // 個別の呼称上書き（alias → 呼称）。固有名詞・特殊呼称のため自由文のマップ。
    // 解決順: addressOf[<alias>] があれば最優先 → なければ secondPerson（代名詞）
    //        → なければ defaultHonorific + 相手の name → それも無ければ文脈推測。
    addressOf: z.record(z.string().nonempty(), z.string().nonempty()).optional(),

    // v1 で唯一許される汎用の自由文補足
    personaNote: z.string().optional()
  })
  .strict()

/**
 * Bible に格納される話者エントリ。CharacterSpec + システム領域。
 *
 * `deprecated: true` は Runner が `/synth` で 404 を受けた時、Editor の吸収で
 * 立てる（以降この alias を BeatSheet.speakers に含めない）。
 */
export const SpeakerEntrySchema = CharacterSpecSchema.extend({
  deprecated: z.boolean().optional()
}).strict()

export type CharacterSpec = z.infer<typeof CharacterSpecSchema>
export type SpeakerEntry = z.infer<typeof SpeakerEntrySchema>
