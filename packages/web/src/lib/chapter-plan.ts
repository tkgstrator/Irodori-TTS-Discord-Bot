import { z } from 'zod'
import { ChapterGenerateFormSchema, type ChapterGenerateFormValues } from '@/schemas/chapter-generation.dto'
import { type ChapterPlan, ChapterPlanSchema } from '@/schemas/chapter-plan.dto'
import { type ChapterPlanRequest, ChapterPlanRequestSchema } from '@/schemas/chapter-plan-request.dto'
import type { LlmSettings } from '@/schemas/llm-settings.dto'
import { backendApi } from './backend-api'
import type { Character } from './characters'
import type { Scenario } from './scenarios'

// おまかせ入力時の章計画用フォーム値を検証する。
const AutoChapterGenerateFormSchema = z.object({
  title: z.string().trim().max(60, '章タイトルは60文字以内で入力してください'),
  promptNote: z.string().trim().max(400, '流れメモは400文字以内で入力してください'),
  characterNames: z.array(z.string().trim().nonempty()).max(10, '登場人物は10人まで選択できます')
})

// シナリオ上の登場人物名から実キャラクターを引き当てる。
const resolveScenarioCharacters = ({
  scenario,
  characters
}: {
  scenario: Scenario
  characters: readonly Character[]
}): readonly Character[] => {
  const plotCharacterSet = new Set(scenario.plotCharacters)
  return characters.filter((character) => plotCharacterSet.has(character.name))
}

// シナリオ内のキャラクターを LLM 向け文脈へ整形する。
const toStoryCharacterContext = (character: Character) => ({
  id: character.id,
  name: character.name,
  ageGroup: character.ageGroup,
  gender: character.gender,
  occupation: character.occupation,
  personalityTags: character.personalityTags,
  speechStyle: character.speechStyle,
  firstPerson: character.firstPerson,
  secondPerson: character.secondPerson,
  honorific: character.honorific,
  attributeTags: character.attributeTags,
  backgroundTags: character.backgroundTags,
  sampleQuotes: character.sampleQuotes,
  memo: character.memo,
  speakerId: character.speakerId,
  caption: character.caption
})

// 章に登場した人物を character id 配列へ変換する。
const resolveChapterCharacterIds = ({
  scenarioCharacters,
  chapter
}: {
  scenarioCharacters: readonly Character[]
  chapter: Scenario['chapters'][number]
}) => {
  const characterBySpeakerId = new Map(
    scenarioCharacters.flatMap((character) =>
      character.speakerId ? [[character.speakerId, character.id] as const] : []
    )
  )
  const characterByName = new Map(scenarioCharacters.map((character) => [character.name, character.id] as const))

  return chapter.characters.flatMap((character) => {
    if (character.speakerId) {
      const matchedCharacterId = characterBySpeakerId.get(character.speakerId)
      return matchedCharacterId ? [matchedCharacterId] : []
    }

    const matchedCharacterId = characterByName.get(character.name)
    return matchedCharacterId ? [matchedCharacterId] : []
  })
}

// 完了済み章から Editor 向けの章要約一覧を組み立てる。
const buildCompletedChapters = ({
  scenario,
  scenarioCharacters
}: {
  scenario: Scenario
  scenarioCharacters: readonly Character[]
}) =>
  scenario.chapters
    .filter((chapter) => chapter.status === 'completed')
    .map((chapter) => ({
      chapterId: chapter.id,
      number: chapter.number,
      title: chapter.title,
      summary: chapter.synopsis.trim() || `第${chapter.number}章「${chapter.title}」で起きた出来事の要約。`,
      presentCharacterIds: resolveChapterCharacterIds({
        scenarioCharacters,
        chapter
      })
    }))

// 手動入力の登場人物名を character id に変換する。
const resolveFocusCharacterIds = ({
  scenarioCharacters,
  input
}: {
  scenarioCharacters: readonly Character[]
  input: ChapterGenerateFormValues
}) => {
  const characterByName = new Map(scenarioCharacters.map((character) => [character.name, character.id] as const))

  return input.characterNames.flatMap((name) => {
    const matchedCharacterId = characterByName.get(name)
    return matchedCharacterId ? [matchedCharacterId] : []
  })
}

// Editor へ送る章計画リクエストを組み立てる。
export const buildChapterPlanRequest = ({
  input,
  llmSettings,
  mode,
  scenario,
  characters
}: {
  input: ChapterGenerateFormValues
  llmSettings: LlmSettings
  mode: 'auto' | 'manual'
  scenario: Scenario
  characters: readonly Character[]
}) => {
  const inputResult =
    mode === 'auto' ? AutoChapterGenerateFormSchema.safeParse(input) : ChapterGenerateFormSchema.safeParse(input)

  if (!inputResult.success) {
    throw new Error('Invalid chapter generation input')
  }

  const scenarioCharacters = resolveScenarioCharacters({ scenario, characters })
  const latestChapterNumber =
    scenario.chapters.length > 0 ? Math.max(...scenario.chapters.map((chapter) => chapter.number)) : 0
  const nextChapterNumber = latestChapterNumber + 1
  const requestResult = ChapterPlanRequestSchema.safeParse({
    schemaVersion: 1,
    dramaId: scenario.id,
    model: {
      editor: llmSettings.editor,
      writer: llmSettings.writer
    },
    scenario: {
      title: scenario.title,
      genres: scenario.genres,
      tone: scenario.tone,
      promptNote: scenario.promptNote
    },
    characters: scenarioCharacters.map((character) => toStoryCharacterContext(character)),
    completedChapters: buildCompletedChapters({
      scenario,
      scenarioCharacters
    }),
    request: {
      mode,
      nextChapterNumber,
      requestedTitle: inputResult.data.title.trim(),
      promptNote: inputResult.data.promptNote.trim(),
      focusCharacterIds: resolveFocusCharacterIds({
        scenarioCharacters,
        input: inputResult.data
      })
    }
  })

  if (!requestResult.success) {
    throw new Error('Invalid chapter plan request')
  }

  return requestResult.data
}

// ChapterPlanRequest を API へ送り、Editor の章設計を受け取る。
export const requestChapterPlan = async (request: ChapterPlanRequest): Promise<ChapterPlan> => {
  return backendApi.requestScenarioChapterPlan(request, {
    params: {
      id: request.dramaId
    }
  })
}

// ChapterPlanRequest からクライアント側プレビュー用の ChapterPlan を組み立てる。
export const createChapterPlan = (request: ChapterPlanRequest): ChapterPlan => {
  const lastCompleted = request.completedChapters.at(-1)
  const chapterNumber = request.request.nextChapterNumber
  const title = request.request.requestedTitle || `第${chapterNumber}章`
  const summary = lastCompleted
    ? `前章「${lastCompleted.title}」を受けて物語を展開する。`
    : `第${chapterNumber}章の概要。`
  const characterIds =
    request.request.focusCharacterIds.length > 0
      ? request.request.focusCharacterIds
      : request.characters.map((character) => character.id)

  return ChapterPlanSchema.parse({
    schemaVersion: 1,
    dramaId: request.dramaId,
    chapter: {
      number: chapterNumber,
      title,
      summary,
      goal: `第${chapterNumber}章の目標。`,
      emotionalArc: `第${chapterNumber}章の感情曲線。`
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
        summary: `第${chapterNumber}章のシーン。`,
        goal: `第${chapterNumber}章のシーン目標。`,
        tension: 'medium',
        presentCharacterIds: characterIds
      }
    ]
  })
}

// 章設計から生成中章に反映する登場人物名を抽出する。
export const resolveChapterPlanCharacterNames = ({
  plan,
  request
}: {
  plan: ChapterPlan
  request: ChapterPlanRequest
}) => {
  const characterById = new Map(request.characters.map((character) => [character.id, character.name] as const))
  const uniqueIds = Array.from(new Set(plan.beatOutline.flatMap((beat) => beat.presentCharacterIds)))

  return uniqueIds.flatMap((characterId) => {
    const characterName = characterById.get(characterId)
    return characterName ? [characterName] : []
  })
}
