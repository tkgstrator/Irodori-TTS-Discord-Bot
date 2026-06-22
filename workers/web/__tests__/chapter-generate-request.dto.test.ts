import { describe, expect, test } from 'bun:test'
import { ChapterGenerateRequestSchema } from '../src/schemas/chapter-generate-request.dto'

describe('ChapterGenerateRequestSchema', () => {
  test('章生成用の JSON を受け入れる', () => {
    const result = ChapterGenerateRequestSchema.safeParse({
      model: {
        editor: 'gemini-3-flash-preview',
        writer: 'gemini-3.1-pro-preview'
      },
      scenario: {
        id: 'scenario-1',
        title: '夏の約束',
        genres: ['学園', '恋愛'],
        tone: 'ほろ苦い',
        rating: '全年齢',
        plotCharacters: ['桜羽エマ', '二階堂ヒロ']
      },
      chapter: {
        mode: 'manual',
        number: 2,
        resolvedTitle: '秘密の場所',
        input: {
          title: '秘密の場所',
          promptNote: '屋上で距離が縮まる展開にしたい',
          characterNames: ['桜羽エマ', '二階堂ヒロ'],
          rating: '全年齢',
          tone: 'ほろ苦い'
        }
      }
    })

    expect(result.success).toBe(true)
  })

  test('resolvedTitle が空の JSON は失敗する', () => {
    const result = ChapterGenerateRequestSchema.safeParse({
      model: {
        editor: 'gemini-3-flash-preview',
        writer: 'gemini-3-flash-preview'
      },
      scenario: {
        id: 'scenario-1',
        title: '夏の約束',
        genres: ['学園'],
        tone: 'ほろ苦い',
        rating: '全年齢',
        plotCharacters: ['桜羽エマ']
      },
      chapter: {
        mode: 'auto',
        number: 1,
        resolvedTitle: '',
        input: {
          title: '',
          promptNote: '',
          characterNames: ['桜羽エマ'],
          rating: '全年齢',
          tone: 'ほろ苦い'
        }
      }
    })

    expect(result.success).toBe(false)
  })
})
