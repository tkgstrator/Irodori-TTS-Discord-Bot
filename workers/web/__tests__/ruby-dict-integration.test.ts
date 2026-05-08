import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../src/api/db'
import { runScenarioEpisodeGeneration } from '../src/api/scenario-episode-generation'
import type { ChapterEpisodeRequest } from '../src/schemas/chapter-episode-request.dto'

const createdScenarioIds = new Set<string>()
const createdDictIds = new Set<string>()

const trackScenarioId = (id: string) => {
  createdScenarioIds.add(id)
}

const trackDictId = (id: string) => {
  createdDictIds.add(id)
}

const createEpisodeRequest = (): ChapterEpisodeRequest => ({
  model: 'gemini-2.5-flash',
  scenario: {
    title: 'ルビ辞書テスト',
    genres: ['学園'],
    tone: 'ほろ苦い',
    rating: '全年齢'
  },
  chapter: {
    title: '第1章',
    synopsis: 'ルビアノテーションのテスト章'
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
        memo: ''
      }
    }
  ]
})

const createScenario = async (title: string) => {
  const scenario = await db.scenario.create({
    data: {
      title,
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
  return scenario
}

const createChapter = async (scenarioId: string) => {
  return db.scenarioChapter.create({
    data: {
      scenarioId,
      number: 1,
      title: '第1章',
      status: 'generating',
      cueCount: 0,
      durationMinutes: 0,
      synopsis: 'テスト章',
      generationError: null
    }
  })
}

const createDict = async (name: string, entries: { word: string; reading: string }[]) => {
  const dict = await db.rubyDict.create({
    data: {
      name,
      entries: { create: entries }
    },
    include: { entries: true }
  })
  trackDictId(dict.id)
  return dict
}

const associateDict = (scenarioId: string, dictId: string) =>
  db.scenarioRubyDict.create({ data: { scenarioId, dictId } })

beforeAll(async () => {
  await db.$connect()
})

afterEach(async () => {
  const scenarioIds = Array.from(createdScenarioIds)
  createdScenarioIds.clear()
  if (scenarioIds.length > 0) {
    await db.scenario.deleteMany({ where: { id: { in: scenarioIds } } })
  }

  const dictIds = Array.from(createdDictIds)
  createdDictIds.clear()
  if (dictIds.length > 0) {
    await db.rubyDict.deleteMany({ where: { id: { in: dictIds } } })
  }
})

afterAll(async () => {
  await db.$disconnect()
})

describe('runScenarioEpisodeGeneration stores raw text', () => {
  test('辞書が関連付けられていても素テキストのまま保存する', async () => {
    const scenario = await createScenario('ルビ適用テスト')
    const chapter = await createChapter(scenario.id)
    const dict = await createDict('テスト辞書', [{ word: '酒寄', reading: 'さかより' }])
    await associateDict(scenario.id, dict.id)

    await runScenarioEpisodeGeneration({
      chapterId: chapter.id,
      request: createEpisodeRequest(),
      scenarioId: scenario.id,
      validateCues: () => undefined,
      writeEpisode: async () => [{ kind: 'speech', speaker: 'char1', text: '酒寄さんが来た。' }]
    })

    const saved = await db.scenarioCue.findFirst({ where: { chapterId: chapter.id } })
    expect(saved?.text).toBe('酒寄さんが来た。')
  })

  test('複数の辞書が関連付けられていても素テキストのまま保存する', async () => {
    const scenario = await createScenario('複数辞書テスト')
    const chapter = await createChapter(scenario.id)
    const dict1 = await createDict('辞書A', [{ word: '酒寄', reading: 'さかより' }])
    const dict2 = await createDict('辞書B', [{ word: '東京', reading: 'とうきょう' }])
    await associateDict(scenario.id, dict1.id)
    await associateDict(scenario.id, dict2.id)

    await runScenarioEpisodeGeneration({
      chapterId: chapter.id,
      request: createEpisodeRequest(),
      scenarioId: scenario.id,
      validateCues: () => undefined,
      writeEpisode: async () => [{ kind: 'speech', speaker: 'char1', text: '酒寄は東京に住んでいる。' }]
    })

    const saved = await db.scenarioCue.findFirst({ where: { chapterId: chapter.id } })
    expect(saved?.text).toBe('酒寄は東京に住んでいる。')
  })

  test('pause と scene のキューも素テキストのまま保存する', async () => {
    const scenario = await createScenario('非スピーチキューテスト')
    const chapter = await createChapter(scenario.id)
    const dict = await createDict('テスト辞書', [{ word: '幕明け', reading: 'まくあけ' }])
    await associateDict(scenario.id, dict.id)

    await runScenarioEpisodeGeneration({
      chapterId: chapter.id,
      request: createEpisodeRequest(),
      scenarioId: scenario.id,
      validateCues: () => undefined,
      writeEpisode: async () => [
        { kind: 'pause', duration: 1.0 },
        { kind: 'scene', name: '幕明け' },
        { kind: 'speech', speaker: 'char1', text: '幕明けの声。' }
      ]
    })

    const cues = await db.scenarioCue.findMany({
      where: { chapterId: chapter.id },
      orderBy: { order: 'asc' }
    })

    expect(cues).toHaveLength(3)
    expect(cues[0]?.kind).toBe('pause')
    expect(cues[0]?.pauseDuration).toBe(1.0)
    expect(cues[1]?.kind).toBe('scene')
    expect(cues[1]?.sceneName).toBe('幕明け')
    expect(cues[2]?.kind).toBe('speech')
    expect(cues[2]?.text).toBe('幕明けの声。')
  })

  test('辞書なしでも素テキストのまま保存する', async () => {
    const scenario = await createScenario('辞書なしテスト')
    const chapter = await createChapter(scenario.id)

    await runScenarioEpisodeGeneration({
      chapterId: chapter.id,
      request: createEpisodeRequest(),
      scenarioId: scenario.id,
      validateCues: () => undefined,
      writeEpisode: async () => [{ kind: 'speech', speaker: 'char1', text: '酒寄さんが来た。' }]
    })

    const saved = await db.scenarioCue.findFirst({ where: { chapterId: chapter.id } })
    expect(saved?.text).toBe('酒寄さんが来た。')
  })
})
