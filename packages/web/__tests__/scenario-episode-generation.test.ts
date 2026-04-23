import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../server/db'
import { runScenarioEpisodeGeneration } from '../server/scenario-episode-generation'

const createdScenarioIds = new Set<string>()

// クリーンアップ対象のシナリオ ID を登録する。
const trackScenarioId = (id: string) => {
  createdScenarioIds.add(id)
}

// 章生成テスト用の Writer リクエストを組み立てる。
const createEpisodeRequest = () => ({
  model: 'gemini-2.5-flash',
  scenario: {
    title: '章生成テスト',
    genres: ['学園'],
    tone: 'ほろ苦い'
  },
  chapter: {
    title: '第1章',
    synopsis: '二人が放課後に会話する。'
  },
  cast: [
    {
      alias: 'char1',
      character: {
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
        sampleQuotes: ['よろしくね'],
        memo: '',
        speakerId: '11111111-1111-4111-8111-111111111111',
        caption: null
      }
    }
  ]
})

beforeAll(async () => {
  await db.$connect()
})

afterEach(async () => {
  if (createdScenarioIds.size === 0) {
    return
  }

  const scenarioIds = Array.from(createdScenarioIds)
  createdScenarioIds.clear()

  await db.scenario.deleteMany({
    where: {
      id: {
        in: scenarioIds
      }
    }
  })
})

afterAll(async () => {
  await db.$disconnect()
})

describe('runScenarioEpisodeGeneration', () => {
  test('生成成功時は cue を保存して completed に更新する', async () => {
    const scenario = await db.scenario.create({
      data: {
        title: '成功テスト',
        genres: ['学園'],
        tone: 'ほろ苦い',
        promptNote: '',
        editorModel: 'gemini-2.5-flash',
        writerModel: 'gemini-2.5-flash',
        ending: 'loop',
        status: 'generating'
      }
    })
    trackScenarioId(scenario.id)

    const chapter = await db.scenarioChapter.create({
      data: {
        scenarioId: scenario.id,
        number: 1,
        title: '第1章',
        status: 'generating',
        cueCount: 0,
        durationMinutes: 0,
        synopsis: '生成中の章',
        generationError: null
      }
    })

    await runScenarioEpisodeGeneration({
      chapterId: chapter.id,
      request: createEpisodeRequest(),
      scenarioId: scenario.id,
      validateCues: () => undefined,
      writeEpisode: async () => [
        {
          kind: 'speech',
          speaker: 'char1',
          text: '放課後の教室で、エマは小さく息を整えた。'
        },
        {
          kind: 'pause',
          duration: 1.2
        }
      ]
    })

    const row = await db.scenario.findUnique({
      where: {
        id: scenario.id
      },
      include: {
        chapters: {
          include: {
            cues: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    })

    expect(row?.status).toBe('completed')
    expect(row?.chapters[0]?.status).toBe('completed')
    expect(row?.chapters[0]?.generationError).toBeNull()
    expect(row?.chapters[0]?.cueCount).toBe(2)
    expect(row?.chapters[0]?.cues).toHaveLength(2)
  })

  test('生成失敗時は既存 cue を保持したまま failed に更新する', async () => {
    const scenario = await db.scenario.create({
      data: {
        title: '失敗テスト',
        genres: ['学園'],
        tone: 'ほろ苦い',
        promptNote: '',
        editorModel: 'gemini-2.5-flash',
        writerModel: 'gemini-2.5-flash',
        ending: 'loop',
        status: 'generating'
      }
    })
    trackScenarioId(scenario.id)

    const chapter = await db.scenarioChapter.create({
      data: {
        scenarioId: scenario.id,
        number: 1,
        title: '第1章',
        status: 'generating',
        cueCount: 1,
        durationMinutes: 1.2,
        synopsis: '再生成中の章',
        generationError: null,
        cues: {
          create: {
            order: 1,
            kind: 'speech',
            speakerAlias: 'char1',
            text: '既存のセリフです。',
            pauseDuration: null
          }
        }
      }
    })

    await runScenarioEpisodeGeneration({
      chapterId: chapter.id,
      request: createEpisodeRequest(),
      scenarioId: scenario.id,
      writeEpisode: async () => {
        throw new Error('Writer failed')
      }
    })

    const row = await db.scenario.findUnique({
      where: {
        id: scenario.id
      },
      include: {
        chapters: {
          include: {
            cues: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    })

    expect(row?.status).toBe('failed')
    expect(row?.chapters[0]?.status).toBe('failed')
    expect(row?.chapters[0]?.generationError).toBe('Writer failed')
    expect(row?.chapters[0]?.cueCount).toBe(1)
    expect(row?.chapters[0]?.cues).toHaveLength(1)
  })
})
