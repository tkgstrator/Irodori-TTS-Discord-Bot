import { Link } from '@tanstack/react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PageContainer } from '@/components/page-container'
import { PageSuspense } from '@/components/page-suspense'
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
import type { Character } from '@/lib/characters'
import { useCharacterMutations, useSuspenseCharacters } from '@/lib/characters'

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

const CharacterCard = ({ character, onDelete }: { character: Character; onDelete: (character: Character) => void }) => {
  const firstChar = character.name.charAt(0) || '?'

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:bg-muted/20">
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-start gap-4">
          <CharacterAvatar character={character} firstChar={firstChar} />

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight">{character.name}</h2>
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

            {character.speaker && (
              <div className="flex flex-wrap gap-1.5">
                <Badge>{character.speaker.name}</Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

const CharactersPageContent = () => {
  const { characters } = useSuspenseCharacters()
  const { deleteCharacter } = useCharacterMutations()
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

  return (
    <PageContainer>
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

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">キャラクターがまだ登録されていません</p>
          <Button asChild size="lg">
            <Link to="/characters/new">
              <Plus data-icon="inline-start" />
              最初のキャラクターを作成
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {characters.map((character) => (
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
    </PageContainer>
  )
}

export const CharactersPage = () => (
  <PageSuspense label="キャラクターを読み込み中です">
    <CharactersPageContent />
  </PageSuspense>
)
