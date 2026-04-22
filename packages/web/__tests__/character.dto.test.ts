import { describe, expect, test } from 'bun:test'
import { CharacterInputSchema, CharacterSchema } from '../schemas/character.dto'

// テスト用の有効なキャラクター入力を組み立てる
const validCharacterInput = {
  name: '桜庭ユウ',
  imageUrl: null,
  ageGroup: 'young_adult',
  gender: 'male',
  occupation: 'student_high',
  personalityTags: ['明るい', '論理的'],
  speechStyle: 'neutral',
  firstPerson: 'boku',
  secondPerson: '',
  honorific: 'san',
  attributeTags: ['眼鏡'],
  backgroundTags: ['天才'],
  memo: 'テスト用メモ',
  speakerId: null
}

describe('CharacterInputSchema', () => {
  test('有効な入力を受け入れる', () => {
    const result = CharacterInputSchema.safeParse(validCharacterInput)

    expect(result.success).toBe(true)
  })

  test('名前が空文字のとき失敗する', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      name: ''
    })

    expect(result.success).toBe(false)
  })
})

describe('CharacterSchema', () => {
  test('永続化済みレスポンスを受け入れる', () => {
    const result = CharacterSchema.safeParse({
      ...validCharacterInput,
      id: '3d0f8e53-45f0-4c18-a1ce-2ff8c0668ea3',
      createdAt: '2026-04-22T10:20:30.000Z',
      updatedAt: '2026-04-22T10:20:30.000Z',
      speaker: null
    })

    expect(result.success).toBe(true)
  })
})
