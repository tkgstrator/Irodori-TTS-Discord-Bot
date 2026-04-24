import { describe, expect, test } from 'bun:test'
import {
  createChapterVdsExport,
  createChapterVdsJsonExport,
  createScenarioVdsExport,
  createScenarioVdsJsonExport
} from '../src/lib/vds'

const scenarioFixture = {
  id: 'scenario-1',
  title: '夏の約束',
  status: 'completed',
  genres: ['学園', '恋愛'],
  tone: 'ほろ苦い',
  promptNote: '',
  editorModel: 'gemini-2.5-flash',
  writerModel: 'gemini-2.5-flash',
  plotCharacters: ['桜羽エマ', '二階堂ヒロ', '月代ユキ'],
  cueCount: 3,
  speakerCount: 3,
  durationMinutes: 1.5,
  isAiGenerated: true,
  updatedAt: '2026-04-23',
  speakers: [
    {
      alias: 'ema',
      name: '桜羽エマ',
      speakerId: '11111111-1111-4111-8111-111111111111',
      caption: null,
      initial: '桜',
      colorClass: 'bg-pink-300 text-pink-800',
      nameColor: 'text-pink-700'
    },
    {
      alias: 'hiro',
      name: '二階堂ヒロ',
      speakerId: '22222222-2222-4222-8222-222222222222',
      caption: null,
      initial: '二',
      colorClass: 'bg-blue-300 text-blue-800',
      nameColor: 'text-blue-700'
    },
    {
      alias: 'yuki',
      name: '月代ユキ',
      speakerId: '33333333-3333-4333-8333-333333333333',
      caption: null,
      initial: '月',
      colorClass: 'bg-purple-300 text-purple-800',
      nameColor: 'text-purple-700'
    }
  ],
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: '出会い',
      status: 'completed',
      cueCount: 3,
      durationMinutes: 1.5,
      synopsis: 'chapter 1 synopsis',
      generationError: null,
      characters: [
        {
          name: '桜羽エマ',
          imageUrl: null,
          speakerId: '11111111-1111-4111-8111-111111111111'
        }
      ],
      cues: [
        {
          kind: 'speech',
          speaker: 'yuki',
          text: '放課後の図書室で、二人は出会った。'
        },
        {
          kind: 'pause',
          duration: 0.8
        },
        {
          kind: 'speech',
          speaker: 'ema',
          text: 'こんにちは、そこで何を読んでいるの？'
        }
      ]
    }
  ]
} as const

describe('createChapterVdsExport', () => {
  test('章の cue から VDS テキストを組み立てる', () => {
    const result = createChapterVdsExport({
      scenario: scenarioFixture,
      chapter: scenarioFixture.chapters[0]
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.fileName).toBe('scenario-scenario-1-chapter-1.vds')
      expect(result.content).toContain('@version: 1')
      expect(result.content).toContain('@title: 夏の約束 第1章 出会い')
      expect(result.content).toContain('@speaker yuki = 33333333-3333-4333-8333-333333333333')
      expect(result.content).toContain('(pause 0.8)')
      expect(result.content).toContain('ema: こんにちは、そこで何を読んでいるの？')
    }
  })

  test('scene cue を含む章の VDS テキストにシーン行が出力される', () => {
    const result = createChapterVdsExport({
      scenario: scenarioFixture,
      chapter: {
        ...scenarioFixture.chapters[0],
        cues: [
          { kind: 'scene', name: '第1場 図書室' },
          { kind: 'speech', speaker: 'yuki', text: '放課後の図書室で、二人は出会った。' },
          { kind: 'pause', duration: 0.8 },
          { kind: 'speech', speaker: 'ema', text: 'こんにちは、そこで何を読んでいるの？' }
        ],
        cueCount: 4
      }
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.content).toContain('@scene: 第1場 図書室')
    }
  })

  test('cue が空の章は出力不可にする', () => {
    const result = createChapterVdsExport({
      scenario: scenarioFixture,
      chapter: {
        ...scenarioFixture.chapters[0],
        id: 'chapter-2',
        cues: [],
        cueCount: 0
      }
    })

    expect(result.ok).toBe(false)

    if (!result.ok) {
      expect(result.reason).toBe('この章には出力できるセリフがありません')
    }
  })
})

describe('createChapterVdsJsonExport', () => {
  test('章の cue から VDS-JSON を組み立てる', () => {
    const result = createChapterVdsJsonExport({
      scenario: scenarioFixture,
      chapter: scenarioFixture.chapters[0]
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.fileName).toBe('scenario-scenario-1-chapter-1.vds.json')
      expect(result.content).toContain('"version": 1')
      expect(result.content).toContain('"title": "夏の約束 第1章 出会い"')
      expect(result.content).toContain('"yuki": {')
      expect(result.content).toContain('"speaker": "ema"')
      expect(result.content).toContain('"type": "lora"')
    }
  })

  test('caption 話者の VDS-JSON に type: caption が含まれる', () => {
    const result = createChapterVdsJsonExport({
      scenario: {
        ...scenarioFixture,
        speakers: scenarioFixture.speakers.map((speaker) =>
          speaker.alias === 'ema' ? { ...speaker, speakerId: null, caption: '明るい女子高生の声' } : speaker
        )
      },
      chapter: scenarioFixture.chapters[0]
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.content).toContain('"type": "caption"')
      expect(result.content).toContain('"caption": "明るい女子高生の声"')
    }
  })
})

describe('createScenarioVdsExport', () => {
  test('章コメント付きでシナリオ全体の VDS テキストを組み立てる', () => {
    const result = createScenarioVdsExport(scenarioFixture)

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.fileName).toBe('scenario-scenario-1.vds')
      expect(result.content).toContain('@title: 夏の約束')
      expect(result.content).toContain('# 第1章: 出会い')
      expect(result.content).toContain('yuki: 放課後の図書室で、二人は出会った。')
    }
  })

  test('speakerId が未設定の話者は caption で出力する', () => {
    const result = createScenarioVdsExport({
      ...scenarioFixture,
      speakers: scenarioFixture.speakers.map((speaker) =>
        speaker.alias === 'ema'
          ? { ...speaker, speakerId: null, caption: '明るい女子高生。素直で親しみやすい声。' }
          : speaker
      )
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.content).toContain('@speaker ema = caption "明るい女子高生。素直で親しみやすい声。"')
    }
  })
})

describe('createScenarioVdsJsonExport', () => {
  test('シナリオ全体の VDS-JSON を組み立てる', () => {
    const result = createScenarioVdsJsonExport(scenarioFixture)

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.fileName).toBe('scenario-scenario-1.vds.json')
      expect(result.content).toContain('"title": "夏の約束"')
      expect(result.content).toContain('"speakers": {')
      expect(result.content).toContain('"speaker": "yuki"')
      expect(result.content).toContain('"type": "lora"')
    }
  })
})
