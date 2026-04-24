import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type RelationType =
  | 'family'
  | 'sibling'
  | 'parent'
  | 'friend'
  | 'bestFriend'
  | 'childhood'
  | 'love'
  | 'crush'
  | 'exLover'
  | 'master'
  | 'colleague'

export interface RelationCharacter {
  readonly id: string
  readonly name: string
  readonly initial: string
  readonly role: string
}

type RelationCharacterInput = Omit<RelationCharacter, 'id'>

export interface Relation {
  readonly id: string
  readonly sourceId: string
  readonly targetId: string
  readonly type: RelationType
  readonly label: string
}

type RelationInput = Omit<Relation, 'id'>

interface RelationsContextValue {
  readonly characters: readonly RelationCharacter[]
  readonly relations: readonly Relation[]
  readonly getCharacter: (id: string) => RelationCharacter | undefined
  readonly getRelationsFor: (id: string) => readonly Relation[]
  readonly addCharacter: (input: RelationCharacterInput) => RelationCharacter
  readonly deleteCharacter: (id: string) => void
  readonly addRelation: (input: RelationInput) => Relation
  readonly updateRelation: (id: string, input: RelationInput) => void
  readonly deleteRelation: (id: string) => void
}

const RelationsContext = createContext<RelationsContextValue | null>(null)

const INITIAL_CHARACTERS: readonly RelationCharacter[] = [
  { id: 'renka', name: '蓮花', initial: '蓮', role: '主人公' },
  { id: 'sakurako', name: '桜子', initial: '桜', role: '蓮花の姉' },
  { id: 'shota', name: '翔太', initial: '翔', role: '蓮花の恋人' },
  { id: 'mizuki', name: '美月', initial: '美', role: '桜子の親友' },
  { id: 'hayato', name: '隼人', initial: '隼', role: 'ライバル' },
  { id: 'kazuki', name: '和樹', initial: '和', role: '幼馴染' }
]

const INITIAL_RELATIONS: readonly Relation[] = [
  { id: 'r1', sourceId: 'renka', targetId: 'sakurako', type: 'sibling', label: '姉妹/兄弟' },
  { id: 'r2', sourceId: 'renka', targetId: 'shota', type: 'love', label: '恋人' },
  { id: 'r3', sourceId: 'renka', targetId: 'kazuki', type: 'childhood', label: '幼馴染' },
  { id: 'r4', sourceId: 'sakurako', targetId: 'mizuki', type: 'bestFriend', label: '親友' },
  { id: 'r5', sourceId: 'mizuki', targetId: 'hayato', type: 'crush', label: '片想い' },
  { id: 'r6', sourceId: 'kazuki', targetId: 'shota', type: 'friend', label: '友人' }
]

export function RelationsProvider({ children }: { children: React.ReactNode }) {
  const [characters, setCharacters] = useState<RelationCharacter[]>([...INITIAL_CHARACTERS])
  const [relations, setRelations] = useState<Relation[]>([...INITIAL_RELATIONS])

  const getCharacter = useCallback((id: string) => characters.find((c) => c.id === id), [characters])

  const getRelationsFor = useCallback(
    (id: string) => relations.filter((r) => r.sourceId === id || r.targetId === id),
    [relations]
  )

  const addCharacter = useCallback((input: RelationCharacterInput): RelationCharacter => {
    const character: RelationCharacter = { ...input, id: crypto.randomUUID() }
    setCharacters((prev) => [...prev, character])
    return character
  }, [])

  const deleteCharacter = useCallback((id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
    setRelations((prev) => prev.filter((r) => r.sourceId !== id && r.targetId !== id))
  }, [])

  const addRelation = useCallback((input: RelationInput): Relation => {
    const relation: Relation = { ...input, id: crypto.randomUUID() }
    setRelations((prev) => [...prev, relation])
    return relation
  }, [])

  const updateRelation = useCallback((id: string, input: RelationInput) => {
    setRelations((prev) => prev.map((r) => (r.id === id ? { ...input, id } : r)))
  }, [])

  const deleteRelation = useCallback((id: string) => {
    setRelations((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const value = useMemo(
    (): RelationsContextValue => ({
      characters,
      relations,
      getCharacter,
      getRelationsFor,
      addCharacter,
      deleteCharacter,
      addRelation,
      updateRelation,
      deleteRelation
    }),
    [
      characters,
      relations,
      getCharacter,
      getRelationsFor,
      addCharacter,
      deleteCharacter,
      addRelation,
      updateRelation,
      deleteRelation
    ]
  )

  return <RelationsContext.Provider value={value}>{children}</RelationsContext.Provider>
}

export function useRelations(): RelationsContextValue {
  const ctx = useContext(RelationsContext)
  if (!ctx) throw new Error('useRelations must be used within RelationsProvider')
  return ctx
}
