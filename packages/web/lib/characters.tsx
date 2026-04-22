import { createContext, useContext, useMemo, useState } from 'react'

export interface Character {
  readonly id: string
  readonly name: string
  readonly imageUrl: string | null
  readonly ageGroup: string
  readonly gender: string
  readonly occupation: string
  readonly personalityTags: readonly string[]
  readonly speechStyle: string
  readonly firstPerson: string
  readonly secondPerson: string
  readonly honorific: string
  readonly attributeTags: readonly string[]
  readonly backgroundTags: readonly string[]
  readonly memo: string
}

export type CharacterInput = Omit<Character, 'id'>

interface CharactersContextValue {
  readonly characters: readonly Character[]
  readonly getCharacter: (id: string) => Character | undefined
  readonly addCharacter: (input: CharacterInput) => Character
  readonly updateCharacter: (id: string, input: CharacterInput) => void
  readonly deleteCharacter: (id: string) => void
}

const CharactersContext = createContext<CharactersContextValue | null>(null)

function generateId(): string {
  return crypto.randomUUID()
}

export function CharactersProvider({ children }: { children: React.ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([])

  const value = useMemo((): CharactersContextValue => {
    const getCharacter = (id: string) => characters.find((c) => c.id === id)

    const addCharacter = (input: CharacterInput): Character => {
      const character: Character = { ...input, id: generateId() }
      setCharacters((prev) => [...prev, character])
      return character
    }

    const updateCharacter = (id: string, input: CharacterInput) => {
      setCharacters((prev) => prev.map((c) => (c.id === id ? { ...input, id } : c)))
    }

    const deleteCharacter = (id: string) => {
      setCharacters((prev) => prev.filter((c) => c.id !== id))
    }

    return { characters, getCharacter, addCharacter, updateCharacter, deleteCharacter }
  }, [characters])

  return <CharactersContext.Provider value={value}>{children}</CharactersContext.Provider>
}

export function useCharacters(): CharactersContextValue {
  const ctx = useContext(CharactersContext)
  if (!ctx) throw new Error('useCharacters must be used within CharactersProvider')
  return ctx
}
