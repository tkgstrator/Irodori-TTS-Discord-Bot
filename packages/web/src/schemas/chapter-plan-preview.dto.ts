import { z } from 'zod'
import { ChapterPlanSchema } from './chapter-plan.dto'
import { ChapterPlanRequestSchema } from './chapter-plan-request.dto'

// 章計画プレビューの遷移元を定義する。
export const ChapterPlanPreviewOriginSchema = z.enum(['scenarios', 'plots'])

// 章計画プレビューの取得状態を定義する。
export const ChapterPlanPreviewStatusSchema = z.enum(['loading', 'ready', 'error'])

// 章計画プレビュー画面で保持する状態を定義する。
export const ChapterPlanPreviewStateSchema = z.object({
  scenarioId: z.string().uuid(),
  origin: ChapterPlanPreviewOriginSchema,
  status: ChapterPlanPreviewStatusSchema,
  request: ChapterPlanRequestSchema,
  plan: ChapterPlanSchema.nullable(),
  errorMessage: z.string().trim().nonempty().nullable()
})

export type ChapterPlanPreviewOrigin = z.infer<typeof ChapterPlanPreviewOriginSchema>
export type ChapterPlanPreviewStatus = z.infer<typeof ChapterPlanPreviewStatusSchema>
export type ChapterPlanPreviewState = z.infer<typeof ChapterPlanPreviewStateSchema>
