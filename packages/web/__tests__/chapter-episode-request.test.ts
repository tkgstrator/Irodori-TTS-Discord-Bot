import { describe, expect, test } from 'bun:test'
import { buildChapterEpisodeRequest } from '../lib/chapter-episode-request'
import type { Scenario } from '../lib/scenarios'
import type { Character } from '../schemas/character.dto'

const scenarioFixture: Scenario = {
  id: '76150d2f-f27b-48d7-9550-893d76f66726',
  title: '夏の約束',
  status: 'completed',
  genres: ['学園', '恋愛'],
  tone: 'ほろ苦い',
  promptNote: '',
  editorModel: 'gemini-2.5-flash',
  writerModel: 'gemini-2.5-flash',
  plotCharacters: ['桜羽エマ', '二階堂ヒロ'],
  cueCount: 12,
  speakerCount: 2,
  durationMinutes: 4,
  isAiGenerated: true,
  updatedAt: '2026-04-23',
  speakers: [
    {
      alias: 'char1',
      name: '桜羽エマ',
      speakerId: '11111111-1111-4111-8111-111111111111',
      caption: null,
      initial: '桜',
      colorClass: 'bg-pink-300 text-pink-800',
      nameColor: 'text-pink-700'
    },
    {
      alias: 'char2',
      name: '二階堂ヒロ',
      speakerId: null,
      caption: '落ち着いた男子高校生。抑えめで低めの声。',
      initial: '二',
      colorClass: 'bg-blue-300 text-blue-800',
      nameColor: 'text-blue-700'
    }
  ],
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: '出会い',
      status: 'draft',
      cueCount: 0,
      durationMinutes: 0,
      synopsis: '転校初日に二人が出会う。',
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
          speakerId: null
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

describe('chapter episode request builder', () => {
  test('ブラウザ送信用の Writer payload を組み立てる', () => {
    const request = buildChapterEpisodeRequest({
      scenario: scenarioFixture,
      chapterId: 'chapter-1',
      characters: charactersFixture
    })

    expect(request.model).toBe('gemini-2.5-flash')
    expect(request.chapter.title).toBe('出会い')
    expect(request.cast).toHaveLength(2)
    expect(request.cast[0]?.alias).toBe('char1')
    expect(request.cast[0]?.character.firstPerson).toBe('watashi')
    expect(request.cast[1]?.character.caption).toBe('落ち着いた男子高校生。抑えめで低めの声。')
  })
})
