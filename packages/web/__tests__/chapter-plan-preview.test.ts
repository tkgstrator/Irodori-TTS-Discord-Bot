import { describe, expect, test } from 'bun:test'
import { parseStoredChapterPlanPreview } from '../lib/chapter-plan-preview'

const previewFixture = {
  scenarioId: '76150d2f-f27b-48d7-9550-893d76f66726',
  origin: 'scenarios',
  status: 'ready',
  request: {
    schemaVersion: 1,
    dramaId: '76150d2f-f27b-48d7-9550-893d76f66726',
    model: {
      editor: 'gemini-2.5-flash',
      writer: 'gemini-2.5-flash'
    },
    scenario: {
      title: '夏の約束',
      genres: ['学園', '恋愛'],
      tone: 'ほろ苦い'
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
        memo: '明るく真っ直ぐ。',
        speakerId: null
      }
    ],
    completedChapters: [],
    request: {
      mode: 'auto',
      nextChapterNumber: 1,
      requestedTitle: '',
      promptNote: '',
      focusCharacterIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']
    }
  },
  plan: {
    schemaVersion: 1,
    dramaId: '76150d2f-f27b-48d7-9550-893d76f66726',
    chapter: {
      number: 1,
      title: '出会い',
      summary: '導入の章。',
      goal: '物語を始める。',
      emotionalArc: '緊張から期待へ。'
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
        summary: '出会いの場面。',
        goal: '導入を作る。',
        tension: 'low',
        presentCharacterIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']
      }
    ]
  },
  errorMessage: null
} as const

describe('chapter plan preview storage', () => {
  test('保存文字列を安全に復元できる', () => {
    const parsedValue = parseStoredChapterPlanPreview({
      scenarioId: '76150d2f-f27b-48d7-9550-893d76f66726',
      storedValue: JSON.stringify(previewFixture)
    })

    expect(parsedValue?.plan.chapter.title).toBe('出会い')
  })

  test('scenarioId が一致しない保存文字列は破棄する', () => {
    const parsedValue = parseStoredChapterPlanPreview({
      scenarioId: '11111111-1111-4111-8111-111111111111',
      storedValue: JSON.stringify(previewFixture)
    })

    expect(parsedValue).toBeNull()
  })
})
