import { SceneKindSchema, TensionSchema } from '@irodori-tts/shared/enums'
import { z } from 'zod'

// schemaVersion を整数 1 に強制する（文字列 "1" も許容）。
const SchemaVersionSchema = z.union([z.literal(1), z.literal('1')]).transform(() => 1 as const)

// emotionalArc がオブジェクトで返された場合に文字列化する。
const EmotionalArcSchema = z
  .union([z.string(), z.record(z.string(), z.unknown())])
  .transform((value) => (typeof value === 'string' ? value.trim() : JSON.stringify(value)))

// presentCharacterIds が省略された場合に空配列へフォールバックする。
const PresentCharacterIdsSchema = z
  .array(z.string().uuid())
  .nonempty()
  .or(z.undefined().transform(() => [] as string[]))

// 章内の Beat 設計を定義する。
const ChapterPlanBeatSchema = z.object({
  order: z.coerce.number().int().positive(),
  sceneKind: SceneKindSchema,
  summary: z.string().trim().nonempty(),
  goal: z.string().trim().nonempty(),
  tension: TensionSchema,
  presentCharacterIds: PresentCharacterIdsSchema
})

// Editor が返す章全体の設計を定義する。
export const ChapterPlanSchema = z
  .object({
    schemaVersion: SchemaVersionSchema,
    dramaId: z.string().uuid(),
    chapter: z.object({
      number: z.coerce.number().int().positive(),
      title: z.string().trim().nonempty(),
      summary: z.string().trim().nonempty(),
      goal: z.string().trim().nonempty(),
      emotionalArc: EmotionalArcSchema
    }),
    continuity: z
      .object({
        mustKeep: z.array(z.string().trim().nonempty()).default([]),
        reveals: z.array(z.string().trim().nonempty()).default([]),
        unresolvedThreads: z.array(z.string().trim().nonempty()).default([])
      })
      .default({ mustKeep: [], reveals: [], unresolvedThreads: [] }),
    beatOutline: z.array(ChapterPlanBeatSchema).nonempty()
  })
  .superRefine((value, ctx) => {
    const orders = value.beatOutline.map((beat) => beat.order)
    const uniqueOrderCount = new Set(orders).size
    const sortedOrders = [...orders].sort((left, right) => left - right)
    const isSorted = orders.every((order, index) => order === sortedOrders[index])

    if (uniqueOrderCount !== orders.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['beatOutline'],
        message: 'Beat order must be unique.'
      })
    }

    if (!isSorted) {
      ctx.addIssue({
        code: 'custom',
        path: ['beatOutline'],
        message: 'Beat order must be sorted.'
      })
    }
  })

export type ChapterPlan = z.infer<typeof ChapterPlanSchema>
