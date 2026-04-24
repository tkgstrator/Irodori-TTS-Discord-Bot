import { describe, expect, test } from 'bun:test'
import {
  buildChapterPlanDebugPayload,
  buildChapterPlanPrompt,
  buildChapterPlanRepairPrompt
} from '../lib/chapter-plan-prompt'
import type { ChapterPlanRequest } from '../schemas/chapter-plan-request.dto'
import { parseChapterPlanText } from '../server/chapter-planner'

const requestFixture: ChapterPlanRequest = {
  schemaVersion: 1,
  dramaId: '76150d2f-f27b-48d7-9550-893d76f66726',
  model: {
    editor: 'gemini-2.5-flash',
    writer: 'gemini-2.5-flash'
  },
  scenario: {
    title: '夏の約束',
    genres: ['学園', '恋愛'],
    tone: 'ほろ苦い',
    promptNote: ''
  },
  characters: [
    {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: '桜羽エマ',
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
      sampleQuotes: ['きっと大丈夫'],
      memo: '明るく真っ直ぐ。',
      speakerId: null,
      caption: '明るい女子高生。素直で少し高めの声。'
    }
  ],
  completedChapters: [
    {
      chapterId: 'chapter-1',
      number: 1,
      title: '出会い',
      summary:
        '桜羽エマが転校初日に二階堂ヒロと校門前で偶然ぶつかり、散らばったノートを拾い集めるところから物語が始まる。',
      presentCharacterIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']
    }
  ],
  request: {
    mode: 'auto',
    nextChapterNumber: 2,
    requestedTitle: '',
    promptNote: '',
    focusCharacterIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']
  }
}

describe('chapter planner', () => {
  test('ChapterPlanRequest を Gemini 向けプロンプトへ整形できる', () => {
    const prompt = buildChapterPlanPrompt(requestFixture)

    expect(prompt).toContain('ChapterPlanRequest')
    expect(prompt).toContain('夏の約束')
    expect(prompt).toContain('桜羽エマが転校初日に二階堂ヒロと校門前で偶然ぶつかり')
  })

  test('Gemini の JSON 文字列を ChapterPlan として検証できる', () => {
    const plan = parseChapterPlanText({
      request: requestFixture,
      text: JSON.stringify({
        schemaVersion: 1,
        dramaId: '76150d2f-f27b-48d7-9550-893d76f66726',
        chapter: {
          number: 2,
          title: '秘密の場所',
          summary: '前章の余韻を受けて、二人が放課後に再会して距離を縮める。',
          goal: '二人の関係を一歩前進させる。',
          emotionalArc: 'ぎこちなさから安心感へ移る。'
        },
        continuity: {
          mustKeep: ['前章での出会いの余韻を保つ。'],
          reveals: [],
          unresolvedThreads: ['二人の距離感は次章以降でも継続する。']
        },
        beatOutline: [
          {
            order: 1,
            sceneKind: 'realtime',
            summary: '再会の導入。',
            goal: '前章との接続を作る。',
            tension: 'low',
            presentCharacterIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']
          }
        ]
      })
    })

    expect(plan.chapter.title).toBe('秘密の場所')
    expect(plan.chapter.number).toBe(2)
  })

  test('Gemini に渡す実 payload を組み立てられる', () => {
    const payload = buildChapterPlanDebugPayload(requestFixture)

    expect(payload.model).toBe('gemini-2.5-flash')
    expect(payload.systemInstruction).toContain('continuity')
    expect(payload.contents).toContain('ChapterPlanRequest')
  })

  test('再生成プロンプトに検証エラーと continuity の形を含める', () => {
    const prompt = buildChapterPlanRepairPrompt({
      request: requestFixture,
      responseText: '{"continuity":{"mustKeep":"前提"}}',
      errorMessage: 'Invalid chapter plan response: continuity.mustKeep: Invalid input: expected array, received string'
    })

    expect(prompt).toContain('continuity')
    expect(prompt).toContain('"mustKeep": ["..."]')
    expect(prompt).toContain('Invalid chapter plan response')
  })

  test('dramaId が一致しない JSON は失敗する', () => {
    expect(() =>
      parseChapterPlanText({
        request: requestFixture,
        text: JSON.stringify({
          schemaVersion: 1,
          dramaId: '11111111-1111-4111-8111-111111111111',
          chapter: {
            number: 2,
            title: '秘密の場所',
            summary: '要約。',
            goal: '目的。',
            emotionalArc: '感情線。'
          },
          continuity: {
            mustKeep: [],
            reveals: [],
            unresolvedThreads: []
          },
          beatOutline: [
            {
              order: 1,
              sceneKind: 'realtime',
              summary: '導入。',
              goal: 'つなぐ。',
              tension: 'low',
              presentCharacterIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']
            }
          ]
        })
      })
    ).toThrow('Chapter plan dramaId mismatch')
  })
})
