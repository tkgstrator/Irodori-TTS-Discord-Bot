import { describe, expect, test } from 'bun:test'
import { ChapterPlanRequestSchema } from '../schemas/chapter-plan-request.dto'

describe('ChapterPlanRequestSchema', () => {
  test('章計画リクエストの JSON を受け入れる', () => {
    const result = ChapterPlanRequestSchema.safeParse({
      schemaVersion: 1,
      dramaId: '76150d2f-f27b-48d7-9550-893d76f66726',
      model: {
        editor: 'gemini-2.5-flash',
        writer: 'gemini-2.5-pro'
      },
      scenario: {
        title: '星降る夜に',
        genres: ['恋愛', '日常'],
        tone: 'メランコリック'
      },
      characters: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: '花京院ちえり',
          ageGroup: 'young_adult',
          gender: 'female',
          occupation: 'student_high',
          personalityTags: ['cheerful'],
          speechStyle: 'neutral',
          firstPerson: 'watashi',
          secondPerson: '',
          honorific: 'san',
          attributeTags: [],
          backgroundTags: [],
          memo: '星を見ると落ち着く。',
          speakerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        }
      ],
      completedChapters: [
        {
          chapterId: '22222222-2222-4222-8222-222222222222',
          number: 1,
          title: '出会い',
          summary: '花京院ちえりと蓮見レイアが天文台で出会い、次の約束を交わした。',
          presentCharacterIds: ['11111111-1111-4111-8111-111111111111']
        }
      ],
      request: {
        mode: 'manual',
        nextChapterNumber: 2,
        requestedTitle: '再会',
        promptNote: '前章の余韻を残して静かに距離を縮める。',
        focusCharacterIds: ['11111111-1111-4111-8111-111111111111']
      }
    })

    expect(result.success).toBe(true)
  })

  test('completedChapters の summary が空文字なら失敗する', () => {
    const result = ChapterPlanRequestSchema.safeParse({
      schemaVersion: 1,
      dramaId: '76150d2f-f27b-48d7-9550-893d76f66726',
      model: {
        editor: 'gemini-2.5-flash',
        writer: 'gemini-2.5-flash'
      },
      scenario: {
        title: '星降る夜に',
        genres: ['恋愛'],
        tone: 'メランコリック'
      },
      characters: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: '花京院ちえり',
          ageGroup: 'young_adult',
          gender: 'female',
          occupation: 'student_high',
          personalityTags: ['cheerful'],
          speechStyle: 'neutral',
          firstPerson: 'watashi',
          secondPerson: '',
          honorific: 'san',
          attributeTags: [],
          backgroundTags: [],
          memo: '',
          speakerId: null
        }
      ],
      completedChapters: [
        {
          chapterId: '22222222-2222-4222-8222-222222222222',
          number: 1,
          title: '出会い',
          summary: '   ',
          presentCharacterIds: ['11111111-1111-4111-8111-111111111111']
        }
      ],
      request: {
        mode: 'auto',
        nextChapterNumber: 2,
        requestedTitle: '',
        promptNote: '',
        focusCharacterIds: []
      }
    })

    expect(result.success).toBe(false)
  })
})
