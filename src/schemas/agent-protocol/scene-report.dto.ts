import { z } from 'zod'
import { SkipReasonSchema } from './enums.dto'

/**
 * Runner → Editor への再生結果報告。
 *
 * 構造の詳細は `docs/agent-protocol/messages.md §4.6 SceneReport` を参照。
 * 物語内容の要約は含まない（Editor が VdsJson を直接読んで吸収するため）。
 */

export const SkippedCueSchema = z
  .object({
    index: z.number().int().nonnegative(),
    reason: SkipReasonSchema,
    detail: z.string().optional()
  })
  .strict()

export const SceneReportSchema = z
  .object({
    schemaVersion: z.literal(1),
    dramaId: z.string().nonempty(),
    beatId: z.string().nonempty(),
    playedCueCount: z.number().int().nonnegative(),
    skippedCues: SkippedCueSchema.array(),
    // 実再生秒数。物語内時間には反映しない（Editor が吸収で決める）
    actualDurationSec: z.number().nonnegative(),
    playedAt: z.iso.datetime()
  })
  .strict()

export type SkippedCue = z.infer<typeof SkippedCueSchema>
export type SceneReport = z.infer<typeof SceneReportSchema>
