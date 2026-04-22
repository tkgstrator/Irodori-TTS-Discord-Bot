import { createFileRoute, Link } from '@tanstack/react-router'
import { Pencil, Plus, Search, Trash2, Volume2, VolumeOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const Route = createFileRoute('/characters/')({
  component: CharactersPage
})

interface Character {
  readonly id: string
  readonly name: string
  readonly firstChar: string
  readonly gender: string
  readonly age: number
  readonly description: string
  readonly voiceConfigured: boolean
}

const MOCK_CHARACTERS: readonly Character[] = [
  {
    id: '1',
    name: '朝日 陽太',
    firstChar: '陽',
    gender: '男性',
    age: 17,
    description: '明るく前向きな高校2年生。何事にも全力で取り組む姿勢が周囲を巻き込んでいく。',
    voiceConfigured: true
  },
  {
    id: '2',
    name: '月城 凛',
    firstChar: '月',
    gender: '女性',
    age: 17,
    description: '冷静沈着な生徒会長。表面上はクールだが、仲間想いの一面を持つ。',
    voiceConfigured: true
  },
  {
    id: '3',
    name: '蒼井 大和',
    firstChar: '蒼',
    gender: '男性',
    age: 17,
    description: '陽太の幼馴染でムードメーカー。コミカルな言動の裏に鋭い洞察力を隠す。',
    voiceConfigured: true
  },
  {
    id: '4',
    name: '紅林 アカネ',
    firstChar: '紅',
    gender: '女性',
    age: 16,
    description: '謎多き転校生。目的は不明だが、陽太たちの行動を監視しているようだ。',
    voiceConfigured: true
  },
  {
    id: '5',
    name: '白石 先生',
    firstChar: '白',
    gender: '男性',
    age: 34,
    description: '担任教師。生徒に寄り添う温厚な性格だが、かつては別の顔を持っていた。',
    voiceConfigured: false
  },
  {
    id: '6',
    name: '雪村 ユキ',
    firstChar: '雪',
    gender: '女性',
    age: 16,
    description: '図書委員の物静かな少女。本の世界に没頭しがちだが、意外な行動力を秘めている。',
    voiceConfigured: false
  }
]

type SortKey = 'name' | 'age' | 'created'

const SORT_OPTIONS: readonly { value: SortKey; label: string }[] = [
  { value: 'name', label: '名前順' },
  { value: 'age', label: '年齢順' },
  { value: 'created', label: '作成日順' }
]

function compareFn(key: SortKey): (a: Character, b: Character) => number {
  switch (key) {
    case 'name':
      return (a, b) => a.name.localeCompare(b.name, 'ja')
    case 'age':
      return (a, b) => a.age - b.age
    case 'created':
      return (a, b) => Number(a.id) - Number(b.id)
  }
}

function sortCharacters(characters: readonly Character[], key: SortKey): Character[] {
  return [...characters].sort(compareFn(key))
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 ring-1 ring-foreground/5 transition-shadow hover:shadow-md">
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="outline" size="icon-sm" aria-label="編集">
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="destructive" size="icon-sm" aria-label="削除">
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="mb-3 flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
          {character.firstChar}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{character.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {character.gender} / {character.age}歳
          </p>
        </div>
      </div>

      <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{character.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {character.voiceConfigured ? (
          <Badge variant="secondary" className="gap-1">
            <Volume2 className="size-2.5" />
            音声設定済み
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <VolumeOff className="size-2.5" />
            音声未設定
          </Badge>
        )}
      </div>
    </div>
  )
}

function CharactersPage() {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase()
    const afterFilter = MOCK_CHARACTERS.filter((c) => {
      if (
        searchLower &&
        !c.name.toLowerCase().includes(searchLower) &&
        !c.description.toLowerCase().includes(searchLower)
      )
        return false
      return true
    })
    return sortCharacters(afterFilter, sortKey)
  }, [search, sortKey])

  const voiceCount = filtered.filter((c) => c.voiceConfigured).length

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

      <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          全 <strong className="text-foreground">{filtered.length}</strong> キャラクター
        </span>
        <span className="text-border">|</span>
        <span>
          音声設定済み: <strong className="text-foreground">{voiceCount}</strong>
        </span>
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
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      )}
    </div>
  )
}
