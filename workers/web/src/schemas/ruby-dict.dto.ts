import { z } from 'zod'

export const RubyDictIdSchema = z.string().uuid()
export const RubyDictEntryIdSchema = z.string().uuid()

export const RubyDictInputSchema = z.object({
  name: z.string().trim().min(1).max(100)
})

export const RubyDictEntryInputSchema = z.object({
  word: z.string().trim().min(1).max(50),
  reading: z.string().trim().min(1).max(100)
})

export const RubyDictEntrySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  word: z.string(),
  reading: z.string(),
  dictId: z.string().uuid()
})

export const RubyDictEntryListSchema = z.array(RubyDictEntrySchema)

export const RubyDictSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  name: z.string(),
  entries: RubyDictEntryListSchema
})

export const RubyDictListSchema = z.array(RubyDictSchema)

export type RubyDictInput = z.infer<typeof RubyDictInputSchema>
export type RubyDictEntryInput = z.infer<typeof RubyDictEntryInputSchema>
export type RubyDictEntry = z.infer<typeof RubyDictEntrySchema>
export type RubyDict = z.infer<typeof RubyDictSchema>
