import { describe, expect, test } from 'bun:test'
import { ChapterGenerateFormSchema } from '../schemas/chapter-generation.dto'

describe('ChapterGenerateFormSchema', () => {
  test('有効な入力を受け入れる', () => {
    const result = ChapterGenerateFormSchema.safeParse({
      title: '出会い',
      promptNote: '冒頭は静かな会話から始めたい',
      characterNames: ['桜羽エマ', '二階堂ヒロ']
    })

    expect(result.success).toBe(true)
  })

  test('流れメモが400文字を超えると失敗する', () => {
    const result = ChapterGenerateFormSchema.safeParse({
      title: '出会い',
      promptNote: 'a'.repeat(401),
      characterNames: ['桜羽エマ']
    })

    expect(result.success).toBe(false)
  })

  test('章タイトルが60文字を超えると失敗する', () => {
    const result = ChapterGenerateFormSchema.safeParse({
      title: 'a'.repeat(61),
      promptNote: '冒頭の流れメモ',
      characterNames: ['桜羽エマ']
    })

    expect(result.success).toBe(false)
  })

  test('章タイトルが空だと失敗する', () => {
    const result = ChapterGenerateFormSchema.safeParse({
      title: '   ',
      promptNote: '冒頭の流れメモ',
      characterNames: ['桜羽エマ']
    })

    expect(result.success).toBe(false)
  })

  test('流れメモが空だと失敗する', () => {
    const result = ChapterGenerateFormSchema.safeParse({
      title: '出会い',
      promptNote: '   ',
      characterNames: ['桜羽エマ']
    })

    expect(result.success).toBe(false)
  })
})
