import { describe, expect, test } from 'bun:test'
import { ScenarioAppendChapterApiSchema, ScenarioCreateApiSchema } from '../src/schemas/scenario-write.dto'

describe('ScenarioCreateApiSchema', () => {
  test('シナリオ作成 API の入力を受け入れる', () => {
    const result = ScenarioCreateApiSchema.safeParse({
      title: '夏の約束',
      genres: ['学園', '恋愛'],
      tone: 'ほろ苦い',
      promptNote: '放課後の屋上シーンを含める',
      editorModel: 'gemini-2.5-flash',
      writerModel: 'gemini-2.5-flash',
      characterIds: ['11111111-1111-4111-8111-111111111111']
    })

    expect(result.success).toBe(true)
  })

  test('ジャンル未選択なら失敗する', () => {
    const result = ScenarioCreateApiSchema.safeParse({
      title: '夏の約束',
      genres: [],
      tone: 'ほろ苦い',
      promptNote: '',
      editorModel: 'gemini-2.5-flash',
      writerModel: 'gemini-2.5-flash',
      characterIds: []
    })

    expect(result.success).toBe(false)
  })
})

describe('ScenarioAppendChapterApiSchema', () => {
  test('章追加 API の入力を受け入れる', () => {
    const result = ScenarioAppendChapterApiSchema.safeParse({
      title: '第2章',
      synopsis: '前章の余韻を引き継いで距離を縮める。',
      characterIds: ['11111111-1111-4111-8111-111111111111']
    })

    expect(result.success).toBe(true)
  })

  test('characterIds が多すぎると失敗する', () => {
    const result = ScenarioAppendChapterApiSchema.safeParse({
      title: '第2章',
      synopsis: '多人数の章。',
      characterIds: [
        '11111111-1111-4111-8111-111111111111',
        '22222222-2222-4222-8222-222222222222',
        '33333333-3333-4333-8333-333333333333',
        '44444444-4444-4444-8444-444444444444',
        '55555555-5555-4555-8555-555555555555',
        '66666666-6666-4666-8666-666666666666',
        '77777777-7777-4777-8777-777777777777',
        '88888888-8888-4888-8888-888888888888',
        '99999999-9999-4999-8999-999999999999',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      ]
    })

    expect(result.success).toBe(false)
  })
})
