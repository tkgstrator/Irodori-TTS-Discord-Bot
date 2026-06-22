import { createFileRoute, Link } from '@tanstack/react-router'
import { Book, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { Suspense, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRubyDictMutations, useSuspenseRubyDicts } from '@/lib/ruby-dict'

const DictionaryListContent = () => {
  const { dicts } = useSuspenseRubyDicts()
  const { addDict, deleteDict } = useRubyDictMutations()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dictName, setDictName] = useState('')

  const openAddDialog = () => {
    setDictName('')
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    await addDict({ name: dictName })
    setDialogOpen(false)
  }

  return (
    <div className="sm:px-6 sm:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">ルビ辞書</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          読み仮名の変換ルールをまとめた辞書を管理します。各辞書はシナリオに紐付けて使用できます。
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{dicts.length} 件の辞書</p>
          <Button type="button" size="sm" onClick={openAddDialog}>
            <Plus className="size-3.5" />
            新規辞書
          </Button>
        </div>

        {dicts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8">
            <p className="text-center text-sm text-muted-foreground">
              登録されている辞書はありません。「新規辞書」ボタンから作成できます。
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dicts.map((dict) => (
              <li key={dict.id}>
                <Link
                  to="/dictionary/$id"
                  params={{ id: dict.id }}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 no-underline transition-colors hover:border-foreground/15 hover:bg-muted/50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Book className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{dict.name}</p>
                    <p className="text-xs text-muted-foreground">{dict.entries.length} エントリ</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive opacity-0 hover:text-destructive group-hover:opacity-100"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">辞書を削除</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>辞書を削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{dict.name}」とすべてのエントリを削除します。この操作は取り消せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteDict(dict.id)}>削除</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規辞書を作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dict-name">辞書名</Label>
              <Input
                id="dict-name"
                value={dictName}
                onChange={(e) => setDictName(e.target.value)}
                placeholder="例: 魔法少女キャスト"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={dictName.trim() === ''}>
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const DictionaryListPage = () => (
  <Suspense
    fallback={
      <div className="sm:px-6">
        <p className="py-8 text-center text-sm text-muted-foreground">辞書を読み込み中...</p>
      </div>
    }
  >
    <DictionaryListContent />
  </Suspense>
)

export const Route = createFileRoute('/dictionary/')({
  component: DictionaryListPage
})
