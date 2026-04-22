import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import type { Character, CharacterInput } from '@/schemas/character.dto'
import { CharacterListSchema, CharacterSchema } from '@/schemas/character.dto'

export type { Character, CharacterInput } from '@/schemas/character.dto'

// API エラーのレスポンス形式を定義する
const ErrorResponseSchema = z.object({
  error: z.string()
})

const CharactersContext = createContext<{
  readonly characters: readonly Character[]
  readonly isLoading: boolean
  readonly errorMessage: string | null
  readonly getCharacter: (id: string) => Character | undefined
  readonly refreshCharacters: () => Promise<void>
  readonly addCharacter: (input: CharacterInput) => Promise<Character>
  readonly updateCharacter: (id: string, input: CharacterInput) => Promise<Character>
  readonly deleteCharacter: (id: string) => Promise<void>
} | null>(null)

// エラーレスポンスから表示用メッセージを抽出する
const readErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text()

  if (!text) {
    return `Request failed with status ${response.status}`
  }

  try {
    const jsonResult = ErrorResponseSchema.safeParse(JSON.parse(text))
    if (jsonResult.success) {
      return jsonResult.data.error
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

  const json = await response.json()
  const result = schema.safeParse(json)

  if (!result.success) {
    throw new Error('Invalid API response')
  }

  return result.data
}

// レスポンス本文のない API を呼び出す
const requestVoid = async (path: string, init?: RequestInit): Promise<void> => {
  const response = await fetch(path, init)

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }
}

export const CharactersProvider = ({ children }: { children: React.ReactNode }) => {
  const [characters, setCharacters] = useState<readonly Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const refreshCharacters = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const rows = await requestJson('/api/characters', CharacterListSchema)
      setCharacters(rows)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load characters')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCharacters()
  }, [refreshCharacters])

  const addCharacter = useCallback(async (input: CharacterInput) => {
    setErrorMessage(null)

    try {
      const row = await requestJson('/api/characters', CharacterSchema, {
        method: 'POST',
        body: JSON.stringify(input)
      })
      setCharacters((prev) => [row, ...prev])
      return row
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create character')
      throw error
    }
  }, [])

  const updateCharacter = useCallback(async (id: string, input: CharacterInput) => {
    setErrorMessage(null)

    try {
      const row = await requestJson(`/api/characters/${id}`, CharacterSchema, {
        method: 'PUT',
        body: JSON.stringify(input)
      })

      setCharacters((prev) => prev.map((character) => (character.id === id ? row : character)))
      return row
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update character')
      throw error
    }
  }, [])

  const deleteCharacter = useCallback(async (id: string) => {
    setErrorMessage(null)

    try {
      await requestVoid(`/api/characters/${id}`, {
        method: 'DELETE'
      })

      setCharacters((prev) => prev.filter((character) => character.id !== id))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete character')
      throw error
    }
  }, [])

  const value = useMemo(
    () => ({
      characters,
      isLoading,
      errorMessage,
      getCharacter: (id: string) => characters.find((character) => character.id === id),
      refreshCharacters,
      addCharacter,
      updateCharacter,
      deleteCharacter
    }),
    [characters, isLoading, errorMessage, refreshCharacters, addCharacter, updateCharacter, deleteCharacter]
  )

  return <CharactersContext.Provider value={value}>{children}</CharactersContext.Provider>
}

export const useCharacters = () => {
  const context = useContext(CharactersContext)

  if (!context) {
    throw new Error('useCharacters must be used within CharactersProvider')
  }

  return context
}
