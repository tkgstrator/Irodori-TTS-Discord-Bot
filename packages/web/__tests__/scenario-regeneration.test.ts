import { describe, expect, test } from 'bun:test'
import { canGenerateNextChapter, canRegenerateChapter, createNextChapter, resolveScenarioState } from '../src/lib/scenarios'

// 再生成判定用の最小章配列を返す。
const createChapters = () =>
  [
    {
      id: 'ch1',
      number: 1,
      title: 'chapter 1',
      status: 'completed',
      cueCount: 1,
      durationMinutes: 1,
      synopsis: 'chapter 1 synopsis',
      generationError: null,
      characters: [],
      cues: []
    },
    {
      id: 'ch2',
      number: 2,
      title: 'chapter 2',
      status: 'completed',
      cueCount: 1,
      durationMinutes: 1,
      synopsis: 'chapter 2 synopsis',
      generationError: null,
      characters: [],
      cues: []
    }
  ] as const

describe('canRegenerateChapter', () => {
  test('後続章がある章は再生成できない', () => {
    const chapters = createChapters()

    expect(canRegenerateChapter(chapters, 'ch1')).toBe(false)
  })

  test('最後の章は再生成できる', () => {
    const chapters = createChapters()

    expect(canRegenerateChapter(chapters, 'ch2')).toBe(true)
  })

  test('存在しない章 ID は再生成不可', () => {
    const chapters = createChapters()

    expect(canRegenerateChapter(chapters, 'missing')).toBe(false)
  })
})

describe('canGenerateNextChapter', () => {
  test('末尾が生成中なら次章を生成できない', () => {
    const chapters = [
      ...createChapters(),
      {
        id: 'ch3',
        number: 3,
        title: 'chapter 3',
        status: 'generating',
        cueCount: 0,
        durationMinutes: 0,
        synopsis: 'chapter 3 synopsis',
        generationError: null,
        characters: [],
        cues: []
      }
    ] as const

    expect(canGenerateNextChapter(chapters)).toBe(false)
  })

  test('末尾が下書きなら次章を生成できない', () => {
    const chapters = [
      ...createChapters(),
      {
        id: 'ch3',
        number: 3,
        title: 'chapter 3',
        status: 'draft',
        cueCount: 0,
        durationMinutes: 0,
        synopsis: 'chapter 3 synopsis',
        generationError: null,
        characters: [],
        cues: []
      }
    ] as const

    expect(canGenerateNextChapter(chapters)).toBe(false)
  })

  test('末尾が失敗なら次章を生成できない', () => {
    const chapters = [
      ...createChapters(),
      {
        id: 'ch3',
        number: 3,
        title: 'chapter 3',
        status: 'failed',
        cueCount: 0,
        durationMinutes: 0,
        synopsis: 'chapter 3 synopsis',
        generationError: 'generation failed',
        characters: [],
        cues: []
      }
    ] as const

    expect(canGenerateNextChapter(chapters)).toBe(false)
  })

  test('末尾が完了済みなら次章を生成できる', () => {
    expect(canGenerateNextChapter(createChapters())).toBe(true)
  })

  test('章が未作成なら第1章を生成できる', () => {
    expect(canGenerateNextChapter([])).toBe(true)
  })
})

describe('createNextChapter', () => {
  test('現在の末尾から次章の生成中データを作る', () => {
    const nextChapter = createNextChapter({
      scenario: {
        id: 'scenario-1',
        title: 'scenario',
        status: 'completed',
        genres: ['学園'],
        tone: 'ほろ苦い',
        promptNote: '',
        editorModel: 'gemini-2.5-flash',
        writerModel: 'gemini-2.5-flash',
        plotCharacters: ['桜羽エマ', '二階堂ヒロ'],
        cueCount: 0,
        speakerCount: 2,
        durationMinutes: null,
        isAiGenerated: false,
        updatedAt: '2026-04-22',
        speakers: [],
        chapters: createChapters()
      },
      characters: [
        {
          id: 'character-1',
          name: '桜羽エマ',
          imageUrl: 'https://example.com/ema.png',
          ageGroup: 'young_adult',
          gender: 'female',
          occupation: 'student_high',
          personalityTags: [],
          speechStyle: 'neutral',
          firstPerson: 'watashi',
          secondPerson: '',
          honorific: 'san',
          attributeTags: [],
          backgroundTags: [],
          sampleQuotes: ['よろしくね'],
          memo: '',
          speakerId: 'speaker-ema',
          caption: null,
          createdAt: '2026-04-22',
          updatedAt: '2026-04-22',
          speaker: null
        }
      ]
    })

    expect(nextChapter.number).toBe(3)
    expect(nextChapter.status).toBe('generating')
    expect(nextChapter.title).toBe('第3章')
    expect(nextChapter.generationError).toBeNull()
    expect(nextChapter.characters).toEqual([
      {
        name: '桜羽エマ',
        imageUrl: 'https://example.com/ema.png',
        speakerId: 'speaker-ema'
      },
      {
        name: '二階堂ヒロ',
        imageUrl: null,
        speakerId: null
      }
    ])
  })

  test('指定した章タイトルを優先して使う', () => {
    const nextChapter = createNextChapter({
      scenario: {
        id: 'scenario-1',
        title: 'scenario',
        status: 'completed',
        genres: ['学園'],
        tone: 'ほろ苦い',
        promptNote: '',
        editorModel: 'gemini-2.5-flash',
        writerModel: 'gemini-2.5-flash',
        plotCharacters: ['桜羽エマ'],
        cueCount: 0,
        speakerCount: 1,
        durationMinutes: null,
        isAiGenerated: false,
        updatedAt: '2026-04-22',
        speakers: [],
        chapters: createChapters()
      },
      input: {
        title: '文化祭前夜',
        promptNote: '',
        characterNames: ['桜羽エマ']
      },
      characters: []
    })

    expect(nextChapter.title).toBe('文化祭前夜')
  })
})

describe('resolveScenarioState', () => {
  test('章がないシナリオは未生成として集計する', () => {
    const scenario = resolveScenarioState({
      scenario: {
        id: 'scenario-1',
        title: 'winter',
        status: 'completed',
        genres: ['ファンタジー'],
        tone: '幻想的',
        promptNote: '',
        editorModel: 'gemini-2.5-flash',
        writerModel: 'gemini-2.5-flash',
        plotCharacters: ['橘シェリー', '氷上メルル'],
        cueCount: 36,
        speakerCount: 2,
        durationMinutes: 6,
        isAiGenerated: true,
        updatedAt: '2026-04-22',
        speakers: [],
        chapters: []
      },
      characters: []
    })

    expect(scenario.status).toBe('draft')
    expect(scenario.cueCount).toBe(0)
    expect(scenario.durationMinutes).toBeNull()
  })

  test('章があるシナリオは章集計を優先する', () => {
    const scenario = resolveScenarioState({
      scenario: {
        id: 'scenario-1',
        title: 'summer',
        status: 'draft',
        genres: ['学園'],
        tone: 'ほろ苦い',
        promptNote: '',
        editorModel: 'gemini-2.5-flash',
        writerModel: 'gemini-2.5-flash',
        plotCharacters: ['桜羽エマ'],
        cueCount: 0,
        speakerCount: 1,
        durationMinutes: null,
        isAiGenerated: false,
        updatedAt: '2026-04-22',
        speakers: [],
        chapters: [
          {
            id: 'ch1',
            number: 1,
            title: 'chapter 1',
            status: 'completed',
            cueCount: 8,
            durationMinutes: 2,
            synopsis: 'chapter 1 synopsis',
            generationError: null,
            characters: [],
            cues: []
          },
          {
            id: 'ch2',
            number: 2,
            title: 'chapter 2',
            status: 'generating',
            cueCount: 5,
            durationMinutes: 1.5,
            synopsis: 'chapter 2 synopsis',
            generationError: null,
            characters: [],
            cues: []
          }
        ]
      },
      characters: []
    })

    expect(scenario.status).toBe('generating')
    expect(scenario.cueCount).toBe(13)
    expect(scenario.durationMinutes).toBe(3.5)
  })

  test('失敗章があるシナリオは failed として集計する', () => {
    const scenario = resolveScenarioState({
      scenario: {
        id: 'scenario-1',
        title: 'autumn',
        status: 'completed',
        genres: ['学園'],
        tone: 'ほろ苦い',
        promptNote: '',
        editorModel: 'gemini-2.5-flash',
        writerModel: 'gemini-2.5-flash',
        plotCharacters: ['桜羽エマ'],
        cueCount: 0,
        speakerCount: 1,
        durationMinutes: null,
        isAiGenerated: false,
        updatedAt: '2026-04-22',
        speakers: [],
        chapters: [
          {
            id: 'ch1',
            number: 1,
            title: 'chapter 1',
            status: 'failed',
            cueCount: 8,
            durationMinutes: 2,
            synopsis: 'chapter 1 synopsis',
            generationError: 'generation failed',
            characters: [],
            cues: []
          }
        ]
      },
      characters: []
    })

    expect(scenario.status).toBe('failed')
  })
})
