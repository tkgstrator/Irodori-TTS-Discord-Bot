import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router'
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { Suspense, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRubyDictEntryMutations, useRubyDictMutations, useSuspenseRubyDict } from '@/lib/ruby-dict'
import type { RubyDictEntry } from '@/schemas/ruby-dict.dto'

type EntryDialogState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; entry: RubyDictEntry }

type RenameDialogState = { open: false } | { open: true; name: string }

const EntryCard = ({ entry, onEdit, onDelete }: { entry: RubyDictEntry; onEdit: () => void; onDelete: () => void }) => (
  <li className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/15 hover:bg-muted/50">
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold">{entry.word}</p>
      <p className="text-xs text-muted-foreground">{entry.reading}</p>
    </div>
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 opacity-0 group-hover:opacity-100"
        onClick={onEdit}
      >
        <Pencil className="size-3.5" />
        <span className="sr-only">編集</span>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-destructive opacity-0 hover:text-destructive group-hover:opacity-100"
        onClick={onDelete}
      >
        <Trash2 className="size-3.5" />
        <span className="sr-only">削除</span>
      </Button>
    </div>
  </li>
)

const DictionaryDetailContent = () => {
  const { id: dictId } = useParams({ from: '/dictionary/$id' })
  const navigate = useNavigate()
  const dict = useSuspenseRubyDict(dictId)
  const { updateDict, deleteDict } = useRubyDictMutations()
  const { addEntry, updateEntry, deleteEntry } = useRubyDictEntryMutations()

  const [entryDialog, setEntryDialog] = useState<EntryDialogState>({ mode: 'closed' })
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({ open: false })
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<RubyDictEntry | null>(null)
  const [deleteDictOpen, setDeleteDictOpen] = useState(false)
  const [word, setWord] = useState('')
  const [reading, setReading] = useState('')

  if (!dict) {
    return (
      <div className="sm:px-6 sm:pb-8">
        <p className="py-8 text-center text-sm text-muted-foreground">辞書が見つかりませんでした。</p>
        <div className="text-center">
          <Button type="button" variant="outline" asChild>
            <Link to="/dictionary">一覧に戻る</Link>
          </Button>
        </div>
      </div>
    )
  }

  const openAddEntry = () => {
    setWord('')
    setReading('')
    setEntryDialog({ mode: 'add' })
  }

  const openEditEntry = (entry: RubyDictEntry) => {
    setWord(entry.word)
    setReading(entry.reading)
    setEntryDialog({ mode: 'edit', entry })
  }

  const closeEntryDialog = () => setEntryDialog({ mode: 'closed' })

  const handleEntrySubmit = async () => {
    if (entryDialog.mode === 'add') {
      await addEntry(dictId, { word, reading })
    } else if (entryDialog.mode === 'edit') {
      await updateEntry(dictId, entryDialog.entry.id, { word, reading })
    }
    closeEntryDialog()
  }

  const openRenameDialog = () => {
    setRenameDialog({ open: true, name: dict.name })
  }

  const handleRename = async () => {
    if (!renameDialog.open) return
    await updateDict(dict.id, { name: renameDialog.name })
    setRenameDialog({ open: false })
  }

  const handleDelete = async () => {
    await deleteDict(dict.id)
    navigate({ to: '/dictionary' })
  }

  return (
    <div className="sm:px-6 sm:pb-8">
      <div className="mb-6 space-y-4">
        <Button type="button" variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link to="/dictionary">
            <ChevronLeft className="size-4" />
            辞書一覧
          </Link>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{dict.name}</h1>
            <Badge variant="secondary">{dict.entries.length} エントリ</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openRenameDialog}>
              <Pencil className="size-3.5" />
              名前を変更
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteDictOpen(true)}
            >
              <Trash2 className="size-3.5" />
              辞書を削除
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">エントリ一覧</p>
          <Button type="button" size="sm" onClick={openAddEntry}>
            <Plus className="size-3.5" />
            エントリ追加
          </Button>
        </div>

        {dict.entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8">
            <p className="text-center text-sm text-muted-foreground">
              エントリがありません。「エントリ追加」ボタンから登録できます。
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dict.entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={() => openEditEntry(entry)}
                onDelete={() => setPendingDeleteEntry(entry)}
              />
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={entryDialog.mode !== 'closed'}
        onOpenChange={(open) => {
          if (!open) closeEntryDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{entryDialog.mode === 'edit' ? '辞書エントリを編集' : '辞書エントリを追加'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ruby-dict-word">単語</Label>
              <Input
                id="ruby-dict-word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="例: 酒寄彩葉"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruby-dict-reading">読み</Label>
              <Input
                id="ruby-dict-reading"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="例: さかよりいろは"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              プレビュー: |{word || '単語'}[{reading || 'よみ'}]
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeEntryDialog}>
              キャンセル
            </Button>
            <Button type="button" onClick={handleEntrySubmit} disabled={word.trim() === '' || reading.trim() === ''}>
              {entryDialog.mode === 'edit' ? '保存' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameDialog.open}
        onOpenChange={(open) => {
          if (!open) setRenameDialog({ open: false })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>辞書名を変更</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rename-dict-name">辞書名</Label>
              <Input
                id="rename-dict-name"
                value={renameDialog.open ? renameDialog.name : ''}
                onChange={(e) => renameDialog.open && setRenameDialog({ open: true, name: e.target.value })}
                placeholder="例: 魔法少女キャスト"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameDialog({ open: false })}>
              キャンセル
            </Button>
            <Button
              type="button"
              onClick={handleRename}
              disabled={!renameDialog.open || renameDialog.name.trim() === ''}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDeleteEntry !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteEntry(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>エントリを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeleteEntry
                ? `「${pendingDeleteEntry.word}」の辞書エントリを削除します。この操作は取り消せません。`
                : 'この操作は取り消せません。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteEntry) {
                  void deleteEntry(dictId, pendingDeleteEntry.id)
                  setPendingDeleteEntry(null)
                }
              }}
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDictOpen} onOpenChange={setDeleteDictOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>辞書を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{dict.name}」とすべてのエントリを削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const DictionaryDetailPage = () => (
  <Suspense
    fallback={
      <div className="sm:px-6">
        <p className="py-8 text-center text-sm text-muted-foreground">辞書を読み込み中...</p>
      </div>
    }
  >
    <DictionaryDetailContent />
  </Suspense>
)

export const Route = createFileRoute('/dictionary/$id')({
  component: DictionaryDetailPage
})
