import { z } from 'zod'

// 章の継続文脈として使う要約情報を定義する。
export const ChapterDigestSchema = z.object({
  chapterId: z.string().nonempty(),
  number: z.number().int().positive(),
  title: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  presentCharacterIds: z.array(z.string().uuid())
})

export type ChapterDigest = z.infer<typeof ChapterDigestSchema>
