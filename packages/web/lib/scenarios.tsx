import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import type { ChapterGenerateFormValues } from '@/schemas/chapter-generation.dto'
import type { Character } from '@/schemas/character.dto'
import {
  ScenarioAppendChapterApiSchema,
  type ScenarioCreateApiInput,
  type ScenarioUpdateApiInput
} from '@/schemas/scenario-write.dto'
import { backendApi, readApiErrorMessage } from './backend-api'

export type ScenarioStatus = 'draft' | 'generating' | 'completed'
export type ChapterStatus = 'draft' | 'generating' | 'completed'

export interface SpeechCue {
  readonly kind: 'speech'
  readonly speaker: string
  readonly text: string
}

export interface PauseCue {
  readonly kind: 'pause'
  readonly duration: number
}

export type Cue = SpeechCue | PauseCue

export interface Speaker {
  readonly alias: string
  readonly name: string
  readonly speakerId: string | null
  readonly initial: string
  readonly imageUrl?: string | null
  readonly colorClass: string
  readonly nameColor: string
}

export type ChapterCharacter = Pick<Character, 'name' | 'imageUrl' | 'speakerId'>

export interface Chapter {
  readonly id: string
  readonly number: number
  readonly title: string
  readonly status: ChapterStatus
  readonly cueCount: number
  readonly durationMinutes: number
  readonly synopsis: string
  readonly characters: readonly ChapterCharacter[]
  readonly cues: readonly Cue[]
}

export interface Scenario {
  readonly id: string
  readonly title: string
  readonly status: ScenarioStatus
  readonly genres: readonly string[]
  readonly tone: string
  readonly plotCharacters: readonly string[]
  readonly cueCount: number
  readonly speakerCount: number
  readonly durationMinutes: number | null
  readonly isAiGenerated: boolean
  readonly updatedAt: string
  readonly speakers: readonly Speaker[]
  readonly chapters: readonly Chapter[]
}

export type ScenarioInput = Omit<Scenario, 'id'>

// 後続章がある章は時系列整合のため再生成不可とする。
export const canRegenerateChapter = (chapters: readonly Chapter[], chapterId: string): boolean => {
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId)

  if (chapterIndex < 0) {
    return false
  }

  return chapterIndex === chapters.length - 1
}

// 生成中の章が存在しないときだけ次章生成を許可する。
export const canGenerateNextChapter = (chapters: readonly Chapter[]): boolean =>
  chapters[chapters.length - 1]?.status !== 'generating'

// シナリオに紐づく登場人物から章表示用のキャラクター配列を組み立てる。
const buildChapterCharacters = ({
  names,
  characters
}: {
  names: readonly string[]
  characters: readonly Character[]
}): readonly ChapterCharacter[] => {
  const characterByName = new Map(characters.map((character) => [character.name, character] as const))

  return names.map((name) => {
    const matched = characterByName.get(name)

    return matched
      ? {
          name: matched.name,
          imageUrl: matched.imageUrl,
          speakerId: matched.speakerId
        }
      : {
          name,
          imageUrl: null,
          speakerId: null
        }
  })
}

// 次章生成時に追加する生成中章を組み立てる。
export const createNextChapter = ({
  scenario,
  characters,
  input
}: {
  scenario: Scenario
  characters: readonly Character[]
  input?: ChapterGenerateFormValues
}): Chapter => {
  const latestNumber =
    scenario.chapters.length > 0 ? Math.max(...scenario.chapters.map((chapter) => chapter.number)) : 0
  const nextNumber = latestNumber + 1
  const selectedNames = input && input.characterNames.length > 0 ? input.characterNames : scenario.plotCharacters
  const chapterTitle = input?.title.trim() || `第${nextNumber}章`
  const promptNote = input?.promptNote.trim() ?? ''
  const synopsis =
    promptNote.length > 0
      ? promptNote
      : selectedNames.length > 0
        ? `${selectedNames.join('・')}を中心に第${nextNumber}章を生成しています。`
        : `第${nextNumber}章を生成しています。`

  return {
    id: crypto.randomUUID(),
    number: nextNumber,
    title: chapterTitle,
    status: 'generating',
    cueCount: 0,
    durationMinutes: 0,
    synopsis,
    characters: buildChapterCharacters({ names: selectedNames, characters }),
    cues: []
  }
}

// speakerId 経由で chapter.characters に最新の character 情報を反映する。
const resolveChapterCharacters = (
  chapters: readonly Chapter[],
  characters: readonly Character[]
): readonly Chapter[] => {
  const characterBySpeakerId = new Map(
    characters.flatMap((character) => (character.speakerId ? [[character.speakerId, character] as const] : []))
  )

  return chapters.map((chapter) => ({
    ...chapter,
    characters: chapter.characters.map((character) =>
      character.speakerId ? (characterBySpeakerId.get(character.speakerId) ?? character) : character
    )
  }))
}

// 章配列から表示用のステータスを再計算する。
const resolveScenarioStatus = (chapters: readonly Chapter[]): ScenarioStatus => {
  if (chapters.length === 0) {
    return 'draft'
  }

  if (chapters.some((chapter) => chapter.status === 'generating')) {
    return 'generating'
  }

  return 'completed'
}

// 章配列から表示用のセリフ数を再計算する。
const resolveScenarioCueCount = (chapters: readonly Chapter[]): number =>
  chapters.reduce((total, chapter) => total + chapter.cueCount, 0)

// 章配列から表示用の再生時間を再計算する。
const resolveScenarioDuration = (chapters: readonly Chapter[]): number | null => {
  if (chapters.length === 0) {
    return null
  }

  return chapters.reduce((total, chapter) => total + chapter.durationMinutes, 0)
}

// 一覧・詳細で使う表示用シナリオを実データから再構築する。
export const resolveScenarioState = ({
  scenario,
  characters
}: {
  scenario: Scenario
  characters: readonly Character[]
}): Scenario => {
  const chapters = resolveChapterCharacters(scenario.chapters, characters)

  return {
    ...scenario,
    status: resolveScenarioStatus(chapters),
    cueCount: resolveScenarioCueCount(chapters),
    durationMinutes: resolveScenarioDuration(chapters),
    chapters
  }
}

/**
 * Query error を UI 向けの Error へ正規化する。
 */
const toApiError = (error: unknown, fallback: string) => new Error(readApiErrorMessage(error, fallback))

/**
 * scenarios 一覧の query key を定義する。
 */
export const scenarioKeys = {
  all: ['scenarios'] as const
}

/**
 * scenarios 一覧取得の query options を定義する。
 */
export const scenariosQueryOptions = queryOptions({
  queryKey: scenarioKeys.all,
  queryFn: async () => {
    try {
      return await backendApi.listScenarios()
    } catch (error) {
      throw toApiError(error, 'Failed to load scenarios')
    }
  }
})

/**
 * 生の scenarios 一覧を Suspense で取得する。
 */
export const useSuspenseScenarios = () => {
  const query = useSuspenseQuery(scenariosQueryOptions)

  return {
    ...query,
    scenarios: query.data,
    getScenario: (id: string) => query.data.find((scenario) => scenario.id === id)
  }
}

/**
 * character 情報を反映した scenarios 一覧を Suspense で取得する。
 */
export const useSuspenseResolvedScenarios = (characters: readonly Character[] = []) => {
  const query = useSuspenseQuery({
    ...scenariosQueryOptions,
    select: (rows: readonly Scenario[]) => rows.map((scenario) => resolveScenarioState({ scenario, characters }))
  })

  return {
    ...query,
    scenarios: query.data,
    getScenario: (id: string) => query.data.find((scenario) => scenario.id === id)
  }
}

/**
 * scenarios 更新系 mutation をまとめて提供する。
 */
export const useScenarioMutations = ({
  characters = [],
  scenarios = []
}: {
  characters?: readonly Character[]
  scenarios?: readonly Scenario[]
} = {}) => {
  const queryClient = useQueryClient()
  const addScenarioMutation = useMutation({
    mutationFn: async (input: ScenarioCreateApiInput) => {
      try {
        return await backendApi.createScenario(input)
      } catch (error) {
        throw toApiError(error, 'Failed to create scenario')
      }
    },
    onSuccess: (scenario) => {
      queryClient.setQueryData<readonly Scenario[]>(scenarioKeys.all, (prev = []) => [scenario, ...prev])
    }
  })
  const updateScenarioMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ScenarioUpdateApiInput }) => {
      try {
        return await backendApi.updateScenario(input, {
          params: {
            id
          }
        })
      } catch (error) {
        throw toApiError(error, 'Failed to update scenario')
      }
    },
    onSuccess: (scenario, variables) => {
      queryClient.setQueryData<readonly Scenario[]>(scenarioKeys.all, (prev = []) =>
        prev.map((item) => (item.id === variables.id ? scenario : item))
      )
    }
  })
  const appendNextChapterMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input?: ChapterGenerateFormValues }) => {
      const scenario = scenarios.find((item) => item.id === id)

      if (!scenario || !canGenerateNextChapter(scenario.chapters)) {
        return undefined
      }

      const characterByName = new Map(characters.map((character) => [character.name, character.id] as const))
      const selectedCharacterIds =
        input && input.characterNames.length > 0
          ? input.characterNames.flatMap((name) => {
              const matchedCharacterId = characterByName.get(name)
              return matchedCharacterId ? [matchedCharacterId] : []
            })
          : scenario.plotCharacters.flatMap((name) => {
              const matchedCharacterId = characterByName.get(name)
              return matchedCharacterId ? [matchedCharacterId] : []
            })
      const bodyResult = ScenarioAppendChapterApiSchema.safeParse({
        title: input?.title.trim() ?? '',
        synopsis: input?.promptNote.trim() ?? '',
        characterIds: selectedCharacterIds
      })

      if (!bodyResult.success) {
        throw new Error('Invalid chapter append request')
      }

      try {
        return await backendApi.appendScenarioChapter(bodyResult.data, {
          params: {
            id
          }
        })
      } catch (error) {
        throw toApiError(error, 'Failed to append scenario chapter')
      }
    },
    onSuccess: (scenario, variables) => {
      if (!scenario) {
        return
      }

      queryClient.setQueryData<readonly Scenario[]>(scenarioKeys.all, (prev = []) =>
        prev.map((item) => (item.id === variables.id ? scenario : item))
      )
    }
  })
  const createEpisodeFromChapterMutation = useMutation({
    mutationFn: async ({ scenarioId, chapterId }: { scenarioId: string; chapterId: string }) => {
      try {
        return await backendApi.createScenarioEpisode(undefined, {
          params: {
            id: scenarioId,
            chapterId
          }
        })
      } catch (error) {
        throw toApiError(error, 'Failed to create episode')
      }
    },
    onSuccess: (scenario, variables) => {
      queryClient.setQueryData<readonly Scenario[]>(scenarioKeys.all, (prev = []) =>
        prev.map((item) => (item.id === variables.scenarioId ? scenario : item))
      )
    }
  })
  const deleteEpisodeFromChapterMutation = useMutation({
    mutationFn: async ({ scenarioId, chapterId }: { scenarioId: string; chapterId: string }) => {
      try {
        return await backendApi.deleteScenarioEpisode(undefined, {
          params: {
            id: scenarioId,
            chapterId
          }
        })
      } catch (error) {
        throw toApiError(error, 'Failed to delete episode')
      }
    },
    onSuccess: (scenario, variables) => {
      queryClient.setQueryData<readonly Scenario[]>(scenarioKeys.all, (prev = []) =>
        prev.map((item) => (item.id === variables.scenarioId ? scenario : item))
      )
    }
  })

  return {
    addScenario: addScenarioMutation.mutateAsync,
    updateScenario: (id: string, input: ScenarioUpdateApiInput) => updateScenarioMutation.mutateAsync({ id, input }),
    appendNextChapter: (id: string, input?: ChapterGenerateFormValues) =>
      appendNextChapterMutation.mutateAsync({ id, input }),
    createEpisodeFromChapter: (scenarioId: string, chapterId: string) =>
      createEpisodeFromChapterMutation.mutateAsync({ scenarioId, chapterId }),
    deleteEpisodeFromChapter: (scenarioId: string, chapterId: string) =>
      deleteEpisodeFromChapterMutation.mutateAsync({ scenarioId, chapterId }),
    deleteScenario: (id: string) => {
      queryClient.setQueryData<readonly Scenario[]>(scenarioKeys.all, (prev = []) =>
        prev.filter((scenario) => scenario.id !== id)
      )
    }
  }
}
