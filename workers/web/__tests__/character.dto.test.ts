import { describe, expect, test } from 'bun:test'
import { CharacterInputSchema, CharacterSchema } from '../src/schemas/character.dto'

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
  sampleQuotes: [],
  memo: 'テスト用メモ',
  speakerId: null,
  caption: '落ち着いた少年。柔らかく自然体の声。'
}

describe('CharacterInputSchema', () => {
  test('有効な入力を受け入れる', () => {
    const result = CharacterInputSchema.safeParse(validCharacterInput)

    expect(result.success).toBe(true)
  })

  test('shared enum に含まれる職業を受け入れる', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      occupation: 'student_middle'
    })

    expect(result.success).toBe(true)
  })

  test('新規追加したフルネーム呼びを受け入れる', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      honorific: 'full_name'
    })

    expect(result.success).toBe(true)
  })

  test('苗字呼びと名前呼びを受け入れる', () => {
    const values = ['family_name', 'given_name'] as const

    for (const honorific of values) {
      const result = CharacterInputSchema.safeParse({
        ...validCharacterInput,
        honorific
      })

      expect(result.success).toBe(true)
    }
  })

  test('新規追加したカタカナのボクを受け入れる', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      firstPerson: 'boku_katakana'
    })

    expect(result.success).toBe(true)
  })

  test('わがはいを受け入れる', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      firstPerson: 'wagahai'
    })

    expect(result.success).toBe(true)
  })

  test('名前が空文字のとき失敗する', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      name: ''
    })

    expect(result.success).toBe(false)
  })

  test('enum に無い一人称のとき失敗する', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      firstPerson: 'boku_katakana_x'
    })

    expect(result.success).toBe(false)
  })

  test('speakerId と caption の両方が無いと失敗する', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      caption: null
    })

    expect(result.success).toBe(false)
  })

  test('speakerId があれば caption が無くても受け入れる', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      speakerId: '3d0f8e53-45f0-4c18-a1ce-2ff8c0668ea3',
      caption: null
    })

    expect(result.success).toBe(true)
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

  test('セリフサンプルを最大5件まで受け入れる', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      sampleQuotes: ['こんにちは', 'よろしくね', '大丈夫？', 'それで？', '行こう']
    })

    expect(result.success).toBe(true)
  })

  test('セリフサンプルが6件あると失敗する', () => {
    const result = CharacterInputSchema.safeParse({
      ...validCharacterInput,
      sampleQuotes: ['1', '2', '3', '4', '5', '6']
    })

    expect(result.success).toBe(false)
  })
})
