'use client'

import type { Personality } from '@irodori-tts/shared/enums'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AGE_GROUP_LABELS,
  FIRST_PERSON_LABELS,
  GENDER_LABELS,
  OCCUPATION_LABELS,
  PERSONALITY_LABELS
} from '@/lib/enum-labels'
import { useStore } from '@/lib/store'
import { useSpeakers } from '@/lib/use-speakers'

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e']
const COLOR_NAMES = ['レッド', 'ブルー', 'グリーン', 'イエロー', 'パープル', 'ティール', 'オレンジ', 'グレー']

export function CharacterCreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addCharacter } = useStore()
  const { speakers, loading: speakersLoading } = useSpeakers()
  const router = useRouter()
  const formId = useId()
  const [selectedPersonality, setSelectedPersonality] = useState<Personality[]>([])

  const togglePersonality = (p: Personality) => {
    setSelectedPersonality((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : prev.length < 4 ? [...prev, p] : prev
    )
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const id = crypto.randomUUID()
    addCharacter({
      id,
      name: fd.get('name') as string,
      ageGroup: fd.get('ageGroup') as Character['ageGroup'],
      gender: fd.get('gender') as Character['gender'],
      personality: selectedPersonality,
      firstPerson: fd.get('firstPerson') as Character['firstPerson'],
      occupation: (fd.get('occupation') as Character['occupation']) || undefined,
      speakerId: fd.get('speakerId') as string,
      color: fd.get('color') as string
    })
    setSelectedPersonality([])
    onOpenChange(false)
    router.push(`/characters/${id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>新しいキャラクター</DialogTitle>
          <DialogDescription>キャラクターの基本情報を入力してください</DialogDescription>
        </DialogHeader>
        <form id={formId} onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">名前</Label>
            <Input id="name" name="name" required placeholder="花京院ちえり" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>年齢</Label>
              <Select name="ageGroup" required>
                <SelectTrigger className="w-full" aria-label="年齢">
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AGE_GROUP_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>性別</Label>
              <Select name="gender" required>
                <SelectTrigger className="w-full" aria-label="性別">
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GENDER_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>性格 ({selectedPersonality.length}/4)</Label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.entries(PERSONALITY_LABELS) as [Personality, string][]).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => togglePersonality(k)}
                  className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Badge
                    variant={selectedPersonality.includes(k) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                  >
                    {v}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>一人称</Label>
              <Select name="firstPerson" required>
                <SelectTrigger className="w-full" aria-label="一人称">
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FIRST_PERSON_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>職業</Label>
              <Select name="occupation">
                <SelectTrigger className="w-full" aria-label="職業">
                  <SelectValue placeholder="選択" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OCCUPATION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>話者</Label>
            <Select name="speakerId">
              <SelectTrigger className="w-full" aria-label="話者">
                <SelectValue placeholder={speakersLoading ? '読み込み中...' : '話者を選択'} />
              </SelectTrigger>
              <SelectContent>
                {speakers.map((s) => (
                  <SelectItem key={s.uuid} value={s.uuid}>
                    {s.name}
                  </SelectItem>
                ))}
                {!speakersLoading && speakers.length === 0 && (
                  <SelectItem value="" disabled>
                    話者が見つかりません
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>カラー</Label>
            <div className="flex gap-3">
              {COLORS.map((c, i) => (
                <label key={c} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={c}
                    defaultChecked={i === 0}
                    className="peer sr-only"
                    aria-label={COLOR_NAMES[i]}
                  />
                  <div
                    className="size-9 rounded-full border-2 border-transparent peer-checked:border-foreground peer-checked:ring-2 peer-checked:ring-ring"
                    style={{ backgroundColor: c }}
                  />
                </label>
              ))}
            </div>
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

type Character = import('@/lib/types').Character
