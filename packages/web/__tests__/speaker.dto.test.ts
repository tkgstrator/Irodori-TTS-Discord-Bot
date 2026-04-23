import { describe, expect, test } from 'bun:test'
import { SpeakerImportListSchema, SpeakerImportTemplateSchema } from '../schemas/speaker.dto'

describe('Speaker DTO', () => {
  test('accepts a valid speaker import list', () => {
    const result = SpeakerImportListSchema.safeParse([
      {
        speakerId: '46a72407-2c4d-57d1-8c07-7d0cac36d01d',
        name: '花京院ちえり'
      }
    ])

    expect(result.success).toBe(true)
  })

  test('accepts a valid speaker import template', () => {
    const result = SpeakerImportTemplateSchema.safeParse({
      speaker: {
        id: '2628aa1b-19f9-5ad9-8a5e-e4da9ef5ebc1',
        name: '桜羽エマ'
      },
      values: {
        ageGroup: 'teen',
        gender: 'female',
        occupation: 'student_high',
        personalityTags: [],
        speechStyle: 'neutral',
        firstPerson: 'watashi',
        secondPerson: '',
        honorific: 'san',
        attributeTags: [],
        backgroundTags: [],
        sampleQuotes: [],
        memo: ''
      }
    })

    expect(result.success).toBe(true)
  })

  test('rejects an invalid speaker id', () => {
    const result = SpeakerImportTemplateSchema.safeParse({
      speaker: {
        id: 'invalid-id',
        name: '桜羽エマ'
      },
      values: {
        ageGroup: 'teen',
        gender: 'female',
        occupation: 'student_high',
        personalityTags: [],
        speechStyle: 'neutral',
        firstPerson: 'watashi',
        secondPerson: '',
        honorific: 'san',
        attributeTags: [],
        backgroundTags: [],
        sampleQuotes: [],
        memo: ''
      }
    })

    expect(result.success).toBe(false)
  })
})
