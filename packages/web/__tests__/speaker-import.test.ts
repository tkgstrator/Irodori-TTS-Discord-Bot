import { describe, expect, test } from 'bun:test'
import { mergeImportedValues } from '../lib/speaker-import'

const currentValues = {
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
  memo: '既存メモ',
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
      memo: ''
    })

    expect(result.name).toBe('既存キャラクター')
    expect(result.personalityTags).toEqual(['穏やか'])
    expect(result.attributeTags).toEqual(['眼鏡'])
    expect(result.backgroundTags).toEqual(['天才'])
    expect(result.memo).toBe('既存メモ')
    expect(result.secondPerson).toBe('anata')
    expect(result.speakerId).toBe(currentValues.speakerId)
  })
})
