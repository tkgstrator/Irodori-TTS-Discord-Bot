import { describe, expect, test } from 'bun:test'
import { buildChapterPlanRequest, createChapterPlan, resolveChapterPlanCharacterNames } from '../src/lib/chapter-plan'
import type { Scenario } from '../src/lib/scenarios'
import type { Character } from '../src/schemas/character.dto'

const scenarioFixture: Scenario = {
  id: '76150d2f-f27b-48d7-9550-893d76f66726',
  title: '夏の約束',
  status: 'completed',
  genres: ['学園', '恋愛'],
  tone: 'ほろ苦い',
  promptNote: '放課後の静かな空気を大事にする。',
  editorModel: 'gemini-2.5-flash',
  writerModel: 'gemini-2.5-flash',
  plotCharacters: ['桜羽エマ', '二階堂ヒロ'],
  cueCount: 12,
  speakerCount: 2,
  durationMinutes: 4,
  isAiGenerated: true,
  updatedAt: '2026-04-23',
  speakers: [],
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: '出会い',
      status: 'completed',
      cueCount: 6,
      durationMinutes: 2,
      synopsis:
        '桜羽エマが転校初日に二階堂ヒロと校門前で偶然ぶつかり、散らばったノートを拾い集めるところから物語が始まる。',
      generationError: null,
      characters: [
        {
          name: '桜羽エマ',
          imageUrl: null,
          speakerId: '11111111-1111-4111-8111-111111111111'
        },
        {
          name: '二階堂ヒロ',
          imageUrl: null,
          speakerId: '22222222-2222-4222-8222-222222222222'
        }
      ],
      cues: []
    }
  ]
}

const charactersFixture: readonly Character[] = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: '桜羽エマ',
    imageUrl: null,
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
    sampleQuotes: ['うん、行こう'],
    memo: '明るく真っ直ぐ。',
    speakerId: '11111111-1111-4111-8111-111111111111',
    caption: null,
    createdAt: '2026-04-23',
    updatedAt: '2026-04-23',
    speaker: null
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: '二階堂ヒロ',
    imageUrl: null,
    ageGroup: 'young_adult',
    gender: 'male',
    occupation: 'student_high',
    personalityTags: ['stoic'],
    speechStyle: 'neutral',
    firstPerson: 'boku',
    secondPerson: '',
    honorific: 'san',
    attributeTags: [],
    backgroundTags: [],
    sampleQuotes: ['……別にいいけど'],
    memo: '口数は少ないが面倒見が良い。',
    speakerId: null,
    caption: '落ち着いた男子高校生。抑えめで低めの声。',
    createdAt: '2026-04-23',
    updatedAt: '2026-04-23',
    speaker: null
  }
]

describe('chapter plan helpers', () => {
  test('過去章の要約から ChapterPlanRequest を組み立てる', () => {
    const request = buildChapterPlanRequest({
      input: {
        title: '',
        promptNote: '',
        characterNames: ['桜羽エマ']
      },
      llmSettings: {
        editor: 'gemini-2.5-flash',
        writer: 'gemini-2.5-flash'
      },
      mode: 'auto',
      scenario: scenarioFixture,
      characters: charactersFixture
    })

    expect(request.completedChapters).toHaveLength(1)
    expect(request.completedChapters[0]?.summary).toContain('桜羽エマが転校初日に二階堂ヒロと校門前で偶然ぶつかり')
    expect(request.request.focusCharacterIds).toEqual(['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'])
    expect(request.scenario.promptNote).toBe('放課後の静かな空気を大事にする。')
    expect(request.characters[0]?.sampleQuotes).toEqual(['うん、行こう'])
    expect(request.characters[1]?.caption).toBe('落ち着いた男子高校生。抑えめで低めの声。')
  })

  test('auto モードでは空の章タイトルと流れメモを許容する', () => {
    const request = buildChapterPlanRequest({
      input: {
        title: '',
        promptNote: '',
        characterNames: ['桜羽エマ']
      },
      llmSettings: {
        editor: 'gemini-2.5-flash',
        writer: 'gemini-2.5-flash'
      },
      mode: 'auto',
      scenario: scenarioFixture,
      characters: charactersFixture
    })

    expect(request.request.requestedTitle).toBe('')
    expect(request.request.promptNote).toBe('')
  })

  test('Editor の章設計から生成対象の登場人物名を戻せる', () => {
    const request = buildChapterPlanRequest({
      input: {
        title: '',
        promptNote: '',
        characterNames: ['桜羽エマ', '二階堂ヒロ']
      },
      llmSettings: {
        editor: 'gemini-2.5-flash',
        writer: 'gemini-2.5-flash'
      },
      mode: 'auto',
      scenario: scenarioFixture,
      characters: charactersFixture
    })
    const plan = createChapterPlan(request)

    expect(plan.chapter.summary).toContain('前章「出会い」')
    expect(resolveChapterPlanCharacterNames({ plan, request })).toEqual(['桜羽エマ', '二階堂ヒロ'])
  })
})
