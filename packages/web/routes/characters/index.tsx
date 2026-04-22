import { createFileRoute, Link } from '@tanstack/react-router'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { GENDERS } from '@/components/character-wizard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Character } from '@/lib/characters'
import { useCharacters } from '@/lib/characters'

export const Route = createFileRoute('/characters/')({
  component: CharactersPage
})

type SortKey = 'name' | 'created'

const SORT_OPTIONS: readonly { value: SortKey; label: string }[] = [
  { value: 'name', label: '名前順' },
  { value: 'created', label: '作成日順' }
]

function compareFn(key: SortKey): (a: Character, b: Character) => number {
  switch (key) {
    case 'name':
      return (a, b) => a.name.localeCompare(b.name, 'ja')
    case 'created':
      return (a, b) => a.id.localeCompare(b.id)
  }
}

function sortCharacters(characters: readonly Character[], key: SortKey): Character[] {
  return [...characters].sort(compareFn(key))
}

function genderLabel(value: string): string {
  return GENDERS.find((g) => g.value === value)?.label ?? value
}

function CharacterCard({ character, onDelete }: { character: Character; onDelete: (id: string) => void }) {
  const firstChar = character.name.charAt(0) || '?'

  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-shadow hover:shadow-md">
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button asChild variant="outline" size="icon-sm" aria-label="編集">
          <Link to="/characters/$id/edit" params={{ id: character.id }}>
            <Pencil className="size-3.5" />
          </Link>
        </Button>
        <Button variant="destructive" size="icon-sm" aria-label="削除" onClick={() => onDelete(character.id)}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="mb-3 flex items-start gap-3">
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt=""
            className="size-12 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {firstChar}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{character.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{genderLabel(character.gender)}</p>
        </div>
      </div>

      {character.memo && <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{character.memo}</p>}

      <div className="flex flex-wrap gap-1.5">
        {character.personalityTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function CharactersPage() {
  const { characters, deleteCharacter } = useCharacters()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase()
    const afterFilter = characters.filter((c) => {
      if (searchLower && !c.name.toLowerCase().includes(searchLower) && !c.memo.toLowerCase().includes(searchLower))
        return false
      return true
    })
    return sortCharacters(afterFilter, sortKey)
  }, [characters, search, sortKey])

  return (
    <div className="p-4 pb-8 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">キャラクター管理</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">登録済みキャラクターの確認・編集</p>
        </div>
        <Button asChild size="lg">
          <Link to="/characters/new">
            <Plus data-icon="inline-start" />
            新規作成
          </Link>
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="名前・説明で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-6 text-sm text-muted-foreground">
        全 <strong className="text-foreground">{filtered.length}</strong> キャラクター
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? '条件に一致するキャラクターが見つかりません' : 'キャラクターがまだ登録されていません'}
          </p>
          {!search && (
            <Button asChild size="lg">
              <Link to="/characters/new">
                <Plus data-icon="inline-start" />
                最初のキャラクターを作成
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((character) => (
            <CharacterCard key={character.id} character={character} onDelete={deleteCharacter} />
          ))}
        </div>
      )}
    </div>
  )
}
