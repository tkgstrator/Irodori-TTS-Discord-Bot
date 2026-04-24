import { describe, expect, test } from 'bun:test'
import { mergeImportedValues } from '../src/lib/speaker-import'
import type { CharacterFormValues } from '../src/schemas/character.dto'

const currentValues: CharacterFormValues = {
  name: '既存キャラクター',
  ageGroup: 'adult',
  gender: 'male',
  occupation: 'teacher',
  personalityTags: ['穏やか'],
  speechStyle: 'polite_formal',
  firstPerson: 'watashi',
  secondPerson: 'anata',
  honorific: 'sensei',
  attributeTags: ['眼鏡'],
  backgroundTags: ['天才'],
  sampleQuotes: ['任せてください'],
  memo: '既存メモ',
  caption: '低めで落ち着いた男性の声。',
  speakerId: '46a72407-2c4d-57d1-8c07-7d0cac36d01d'
}

describe('speaker import helpers', () => {
  test('空値では既存フォーム値を上書きしない', () => {
    const result = mergeImportedValues(currentValues, {
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
      memo: '',
      caption: null
    })

    expect(result.name).toBe('既存キャラクター')
    expect(result.personalityTags).toEqual(['穏やか'])
    expect(result.attributeTags).toEqual(['眼鏡'])
    expect(result.backgroundTags).toEqual(['天才'])
    expect(result.sampleQuotes).toEqual(['任せてください'])
    expect(result.memo).toBe('既存メモ')
    expect(result.caption).toBe(currentValues.caption)
    expect(result.secondPerson).toBe('anata')
    expect(result.speakerId).toBe(currentValues.speakerId)
  })
})
