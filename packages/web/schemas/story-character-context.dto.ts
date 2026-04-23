import type { z } from 'zod'
import { CharacterSchema } from './character.dto'

// LLM に渡すキャラクター文脈の最小スナップショットを定義する。
export const StoryCharacterContextSchema = CharacterSchema.pick({
  id: true,
  name: true,
  ageGroup: true,
  gender: true,
  occupation: true,
  personalityTags: true,
  speechStyle: true,
  firstPerson: true,
  secondPerson: true,
  honorific: true,
  attributeTags: true,
  backgroundTags: true,
  sampleQuotes: true,
  memo: true,
  speakerId: true
})

export type StoryCharacterContext = z.infer<typeof StoryCharacterContextSchema>
