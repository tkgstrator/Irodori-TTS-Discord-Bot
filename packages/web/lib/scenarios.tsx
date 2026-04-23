import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import type { ChapterGenerateFormValues } from '@/schemas/chapter-generation.dto'
import type { Character } from '@/schemas/character.dto'
import { ScenarioApiListSchema, ScenarioApiSchema } from '@/schemas/scenario-api.dto'
import {
  ScenarioAppendChapterApiSchema,
  type ScenarioCreateApiInput,
  type ScenarioUpdateApiInput
} from '@/schemas/scenario-write.dto'
import { useCharacters } from './characters'

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

interface ScenariosContextValue {
  readonly scenarios: readonly Scenario[]
  readonly isLoading: boolean
  readonly errorMessage: string | null
  readonly getScenario: (id: string) => Scenario | undefined
  readonly refreshScenarios: () => Promise<void>
  readonly addScenario: (input: ScenarioCreateApiInput) => Promise<Scenario>
  readonly updateScenario: (id: string, input: ScenarioUpdateApiInput) => Promise<Scenario>
  readonly appendNextChapter: (id: string, input?: ChapterGenerateFormValues) => Promise<Scenario | undefined>
  readonly deleteScenario: (id: string) => void
}

const ScenariosContext = createContext<ScenariosContextValue | null>(null)

const ErrorResponseSchema = z.object({
  error: z.string()
})

// API エラーの本文から表示用メッセージを取り出す
const readErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text()

  if (!text) {
    return `Request failed with status ${response.status}`
  }

  try {
    const result = ErrorResponseSchema.safeParse(JSON.parse(text))

    if (result.success) {
      return result.data.error
    }
  } catch {
    return text
  }

  return `Request failed with status ${response.status}`
}

// JSON API を呼び出してレスポンスを検証する
const requestJson = async <TSchema extends z.ZodTypeAny>(
  path: string,
  schema: TSchema,
  init?: RequestInit
): Promise<z.infer<TSchema>> => {
  const response = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers
    }
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  const body = await response.json()
  const result = schema.safeParse(body)

  if (!result.success) {
    throw new Error('Invalid API response')
  }

  return result.data
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

export function ScenariosProvider({ children }: { children: React.ReactNode }) {
  const { characters } = useCharacters()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshScenarios = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const rows = await requestJson('/api/scenarios', ScenarioApiListSchema)
      setScenarios(rows)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load scenarios')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshScenarios()
  }, [refreshScenarios])

  const value = useMemo((): ScenariosContextValue => {
    const resolvedScenarios = scenarios.map((scenario) => resolveScenarioState({ scenario, characters }))
    const getScenario = (id: string) => resolvedScenarios.find((scenario) => scenario.id === id)

    const addScenario = async (input: ScenarioCreateApiInput): Promise<Scenario> => {
      const row = await requestJson('/api/scenarios', ScenarioApiSchema, {
        method: 'POST',
        body: JSON.stringify(input)
      })

      setScenarios((prev) => [row, ...prev])
      return row
    }

    const updateScenario = async (id: string, input: ScenarioUpdateApiInput): Promise<Scenario> => {
      const row = await requestJson(`/api/scenarios/${id}`, ScenarioApiSchema, {
        method: 'PUT',
        body: JSON.stringify(input)
      })

      setScenarios((prev) => prev.map((item) => (item.id === id ? row : item)))
      return row
    }

    const appendNextChapter = async (id: string, input?: ChapterGenerateFormValues) => {
      const scenario = resolvedScenarios.find((item) => item.id === id)

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

      const row = await requestJson(`/api/scenarios/${id}/chapters`, ScenarioApiSchema, {
        method: 'POST',
        body: JSON.stringify(bodyResult.data)
      })

      setScenarios((prev) => prev.map((item) => (item.id === id ? row : item)))
      return row
    }

    const deleteScenario = (id: string) => {
      setScenarios((prev) => prev.filter((s) => s.id !== id))
    }

    return {
      scenarios: resolvedScenarios,
      isLoading,
      errorMessage,
      getScenario,
      refreshScenarios,
      addScenario,
      updateScenario,
      appendNextChapter,
      deleteScenario
    }
  }, [characters, errorMessage, isLoading, refreshScenarios, scenarios])

  return <ScenariosContext.Provider value={value}>{children}</ScenariosContext.Provider>
}

export function useScenarios(): ScenariosContextValue {
  const ctx = useContext(ScenariosContext)
  if (!ctx) throw new Error('useScenarios must be used within ScenariosProvider')
  return ctx
}
