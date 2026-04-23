import { SceneKindSchema, TensionSchema } from '@irodori-tts/shared/enums'
import { z } from 'zod'

// 章内の Beat 設計を定義する。
export const ChapterPlanBeatSchema = z.object({
  order: z.number().int().positive(),
  sceneKind: SceneKindSchema,
  summary: z.string().trim().min(1),
  goal: z.string().trim().min(1),
  tension: TensionSchema,
  presentCharacterIds: z.array(z.string().uuid()).min(1)
})

// Editor が返す章全体の設計を定義する。
export const ChapterPlanSchema = z
  .object({
    schemaVersion: z.literal(1),
    dramaId: z.string().uuid(),
    chapter: z.object({
      number: z.number().int().positive(),
      title: z.string().trim().min(1),
      summary: z.string().trim().min(1),
      goal: z.string().trim().min(1),
      emotionalArc: z.string().trim().min(1)
    }),
    continuity: z.object({
      mustKeep: z.array(z.string().trim().min(1)),
      reveals: z.array(z.string().trim().min(1)),
      unresolvedThreads: z.array(z.string().trim().min(1))
    }),
    beatOutline: z.array(ChapterPlanBeatSchema).min(1)
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
