import { z } from 'zod'
import { SpeakerEntrySchema } from './character.dto'
import { GenreSchema, ToneSchema } from './enums.dto'

/**
 * ドラマ全体の長命状態。Editor のみが読み書きする。
 *
 * 構造の詳細は `docs/agent-protocol/messages.md §4.2 DramaBible` を参照。
 */

/** 物語内で言及された事実の台帳エントリ。 */
export const FactSchema = z
  .object({
    factId: z.string().nonempty(),
    content: z.string().nonempty(),
    acquiredInBeatId: z.string().nonempty()
  })
  .strict()

export const DramaBibleSchema = z
  .object({
    schemaVersion: z.literal(1),
    dramaId: z.string().nonempty(),
    title: z.string(),

    genre: z
      .object({
        categories: GenreSchema.array().nonempty().max(3),
        tone: ToneSchema
      })
      .strict(),

    cast: z
      .object({
        // 主人公は speakers の中で relationship: 'self' を持つ 1 エントリ。
        // 別途フィールドは持たない（DramaBrief と同じ方針）。
        speakers: z.record(z.string().nonempty(), SpeakerEntrySchema)
      })
      .strict(),

    premise: z.string(),
    world: z.string(),
    relationships: z.string(),

    // 初期は空。Editor が VdsJson の吸収で随時追記する。
    // キーは factId。
    facts: z.record(z.string().nonempty(), FactSchema),

    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime()
  })
  .strict()

export type Fact = z.infer<typeof FactSchema>
export type DramaBible = z.infer<typeof DramaBibleSchema>
