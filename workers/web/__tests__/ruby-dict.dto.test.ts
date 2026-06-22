import { describe, expect, test } from 'bun:test'
import { RubyDictEntryInputSchema, RubyDictInputSchema } from '../src/schemas/ruby-dict.dto'

describe('RubyDictInputSchema', () => {
  test('有効な名前を受け入れる', () => {
    const result = RubyDictInputSchema.safeParse({ name: '共通辞書' })
    expect(result.success).toBe(true)
  })

  test('名前が空のとき失敗する', () => {
    const result = RubyDictInputSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  test('名前が 100 文字を超えると失敗する', () => {
    const result = RubyDictInputSchema.safeParse({ name: 'あ'.repeat(101) })
    expect(result.success).toBe(false)
  })

  test('名前の前後の空白をトリムする', () => {
    const result = RubyDictInputSchema.safeParse({ name: '  共通辞書  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('共通辞書')
    }
  })
})

describe('RubyDictEntryInputSchema', () => {
  const validInput = { word: '酒寄', reading: 'さかより' }

  test('有効な入力を受け入れる', () => {
    const result = RubyDictEntryInputSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  test('word が空のとき失敗する', () => {
    const result = RubyDictEntryInputSchema.safeParse({ ...validInput, word: '' })
    expect(result.success).toBe(false)
  })

  test('reading が空のとき失敗する', () => {
    const result = RubyDictEntryInputSchema.safeParse({ ...validInput, reading: '' })
    expect(result.success).toBe(false)
  })

  test('word が 50 文字を超えると失敗する', () => {
    const result = RubyDictEntryInputSchema.safeParse({ ...validInput, word: 'あ'.repeat(51) })
    expect(result.success).toBe(false)
  })

  test('reading が 100 文字を超えると失敗する', () => {
    const result = RubyDictEntryInputSchema.safeParse({ ...validInput, reading: 'あ'.repeat(101) })
    expect(result.success).toBe(false)
  })

  test('word の前後の空白をトリムする', () => {
    const result = RubyDictEntryInputSchema.safeParse({ ...validInput, word: '  酒寄  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.word).toBe('酒寄')
    }
  })

  test('reading の前後の空白をトリムする', () => {
    const result = RubyDictEntryInputSchema.safeParse({ ...validInput, reading: '  さかより  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reading).toBe('さかより')
    }
  })

  test('scenarioId フィールドを持たない', () => {
    const result = RubyDictEntryInputSchema.safeParse({ ...validInput, scenarioId: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('scenarioId' in result.data).toBe(false)
    }
  })
})
