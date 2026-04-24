import { z } from 'zod'
import { CharacterCoreSchema } from './character.dto'

// LLM に渡すキャラクター文脈の最小スナップショットを定義する。
export const StoryCharacterContextSchema = CharacterCoreSchema.extend({
  id: z.string().uuid()
})
  .pick({
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
    speakerId: true,
    caption: true
  })
  .superRefine((value, ctx) => {
    if (value.speakerId !== null || value.caption !== null) {
      return
    }

    ctx.addIssue({
      code: 'custom',
      path: ['caption'],
      message: '話者連携または caption のどちらかは必須です'
    })
  })
