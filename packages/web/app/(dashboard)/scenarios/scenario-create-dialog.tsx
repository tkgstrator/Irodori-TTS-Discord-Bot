'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useId, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useStore } from '@/lib/store'

export function ScenarioCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { characters, addScenario } = useStore()
  const router = useRouter()
  const formId = useId()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const id = crypto.randomUUID()
    addScenario({
      id,
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      characterIds: selectedIds,
      createdAt: new Date().toISOString()
    })
    setSelectedIds([])
    onOpenChange(false)
    router.push(`/scenarios/${id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新しいシナリオ</DialogTitle>
          <DialogDescription>シナリオの基本情報と登場キャラクターを選択してください</DialogDescription>
        </DialogHeader>
        <form id={formId} onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="title">タイトル</Label>
            <Input id="title" name="title" required placeholder="第1話 出会い" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">あらすじ</Label>
            <Textarea id="description" name="description" rows={3} placeholder="シナリオの概要..." />
          </div>
          <div className="grid gap-2">
            <Label>登場キャラクター</Label>
            {characters.length === 0 ? (
              <p className="text-sm text-muted-foreground">先にキャラクターを登録してください</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => toggle(char.id)}
                    className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <Badge
                      variant={selectedIds.includes(char.id) ? 'default' : 'outline'}
                      className="cursor-pointer gap-1.5 transition-colors"
                    >
                      <span className="size-2 rounded-full" style={{ backgroundColor: char.color }} />
                      {char.name}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button type="submit" form={formId}>
            作成
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
