import { z } from 'zod'

// 章の継続文脈として使う要約情報を定義する。
export const ChapterDigestSchema = z.object({
  chapterId: z.string().nonempty(),
  number: z.number().int().positive(),
  title: z.string().trim().nonempty(),
  summary: z.string().trim().nonempty(),
  presentCharacterIds: z.array(z.string().uuid())
})
