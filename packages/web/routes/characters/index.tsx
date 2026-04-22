import { createFileRoute, Link } from '@tanstack/react-router'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { GENDERS } from '@/components/character-wizard'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
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

const AGE_GROUPS = [
  { value: 'infant', label: '乳幼児' },
  { value: 'child', label: '子供' },
  { value: 'preteen', label: '小学生' },
  { value: 'teen', label: '10代' },
  { value: 'young_adult', label: '青年' },
  { value: 'adult', label: '成人' },
  { value: 'middle_aged', label: '中年' },
  { value: 'elderly', label: '高齢' },
  { value: 'ageless', label: '不老' }
] as const

const OCCUPATIONS = [
  { value: 'student_high', label: '高校生' },
  { value: 'student_college', label: '大学生' },
  { value: 'teacher', label: '教師' },
  { value: 'engineer', label: 'エンジニア' },
  { value: 'adventurer', label: '冒険者' },
  { value: 'knight', label: '騎士' },
  { value: 'mage', label: '魔法使い' },
  { value: 'detective', label: '探偵' },
  { value: 'doctor', label: '医師' },
  { value: 'merchant', label: '商人' },
  { value: 'other', label: 'その他' }
] as const

const SPEECH_STYLES = [
  { value: 'polite_formal', label: '丁寧語' },
  { value: 'polite_casual', label: 'やや丁寧' },
  { value: 'neutral', label: '標準' },
  { value: 'casual_youthful', label: 'カジュアル' },
  { value: 'rough_masculine', label: '荒い' },
  { value: 'refined_feminine', label: '上品' },
  { value: 'archaic_samurai', label: '武士風' },
  { value: 'archaic_court', label: '宮廷風' },
  { value: 'dialect_regional', label: '方言' },
  { value: 'childlike', label: '子供っぽい' },
  { value: 'eccentric', label: '独特' }
] as const

const FIRST_PERSONS = [
  { value: 'watashi', label: '私' },
  { value: 'watakushi', label: 'わたくし' },
  { value: 'atashi', label: 'あたし' },
  { value: 'boku', label: '僕' },
  { value: 'ore', label: '俺' },
  { value: 'uchi', label: 'うち' },
  { value: 'washi', label: 'ワシ' },
  { value: 'name', label: '自分の名前' },
  { value: 'other', label: 'その他' }
] as const

const HONORIFICS = [
  { value: 'none', label: '呼び捨て' },
  { value: 'san', label: '〜さん' },
  { value: 'chan', label: '〜ちゃん' },
  { value: 'kun', label: '〜君' },
  { value: 'sama', label: '〜様' },
  { value: 'senpai', label: '〜先輩' },
  { value: 'sensei', label: '〜先生' }
] as const

function compareFn(key: SortKey): (a: Character, b: Character) => number {
  switch (key) {
    case 'name':
      return (a, b) => a.name.localeCompare(b.name, 'ja')
    case 'created':
      return (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  }
}

function sortCharacters(characters: readonly Character[], key: SortKey): Character[] {
  return [...characters].sort(compareFn(key))
}

function genderLabel(value: string): string {
  return GENDERS.find((g) => g.value === value)?.label ?? value
}

function optionLabel(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

function ageGroupLabel(value: string): string {
  return optionLabel(AGE_GROUPS, value)
}

function occupationLabel(value: string): string {
  return optionLabel(OCCUPATIONS, value)
}

function speechStyleLabel(value: string): string {
  return optionLabel(SPEECH_STYLES, value)
}

function firstPersonLabel(value: string): string {
  return optionLabel(FIRST_PERSONS, value)
}

function honorificLabel(value: string): string {
  return optionLabel(HONORIFICS, value)
}

function metadataSummary(character: Character): readonly string[] {
  return [
    speechStyleLabel(character.speechStyle),
    firstPersonLabel(character.firstPerson),
    character.honorific !== 'none' ? honorificLabel(character.honorific) : null,
    character.secondPerson || null
  ].filter((value): value is string => value !== null && value.length > 0)
}

const CharacterAvatar = ({ character, firstChar }: { character: Character; firstChar: string }) => {
  if (character.imageUrl) {
    return (
      <img
        src={character.imageUrl}
        alt=""
        className="size-14 shrink-0 rounded-full border border-border object-cover"
      />
    )
  }

  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-base font-semibold text-secondary-foreground">
      {firstChar}
    </div>
  )
}

function CharacterCard({ character, onDelete }: { character: Character; onDelete: (character: Character) => void }) {
  const firstChar = character.name.charAt(0) || '?'
  const summaryItems = metadataSummary(character)
  const hasDetailTags = character.attributeTags.length > 0 || character.backgroundTags.length > 0

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-muted/20">
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start gap-4">
          <CharacterAvatar character={character} firstChar={firstChar} />

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight">{character.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ageGroupLabel(character.ageGroup)} ・ {genderLabel(character.gender)} ・{' '}
                  {occupationLabel(character.occupation)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button asChild variant="ghost" size="icon-sm" aria-label="編集">
                  <Link to="/characters/$id/edit" params={{ id: character.id }}>
                    <Pencil className="size-3.5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label="削除" onClick={() => onDelete(character)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {character.speaker && <Badge>{character.speaker.name}</Badge>}
              {summaryItems.map((item) => (
                <Badge key={item} variant="outline" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {character.memo ? (
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{character.memo}</p>
        ) : null}

        {character.personalityTags.length > 0 && (
          <section>
            <p className="mb-2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">性格</p>
            <div className="flex flex-wrap gap-1.5">
              {character.personalityTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {hasDetailTags && (
          <section>
            <p className="mb-2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">属性・背景</p>
            <div className="flex flex-wrap gap-1.5">
              {character.attributeTags.map((tag) => (
                <Badge key={`attribute-${tag}`} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {character.backgroundTags.map((tag) => (
                <Badge key={`background-${tag}`} variant="outline" className="border-dashed text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}

function CharactersPage() {
  const { characters, deleteCharacter, errorMessage, isLoading, refreshCharacters } = useCharacters()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [pendingDeleteCharacter, setPendingDeleteCharacter] = useState<Character | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!pendingDeleteCharacter) {
      return
    }

    try {
      setIsDeleting(true)
      await deleteCharacter(pendingDeleteCharacter.id)
      setPendingDeleteCharacter(null)
    } catch {
      return
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase()
    const afterFilter = characters.filter((c) => {
      const speakerName = c.speaker?.name.toLowerCase() ?? ''

      if (
        searchLower &&
        !c.name.toLowerCase().includes(searchLower) &&
        !c.memo.toLowerCase().includes(searchLower) &&
        !speakerName.includes(searchLower)
      )
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
          <SelectTrigger className="w-30">
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

      {errorMessage && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={() => void refreshCharacters()}>
            再読み込み
          </Button>
        </div>
      )}

      {isLoading && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">キャラクターを読み込み中です</p>
        </div>
      ) : filtered.length === 0 ? (
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((character) => (
            <CharacterCard key={character.id} character={character} onDelete={setPendingDeleteCharacter} />
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDeleteCharacter !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isDeleting) {
            setPendingDeleteCharacter(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>キャラクターを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteCharacter
                ? `${pendingDeleteCharacter.name} を削除します。この操作は元に戻せません。`
                : 'この操作は元に戻せません。'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteCharacter(null)} disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
              {isDeleting ? '削除中...' : '削除する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
