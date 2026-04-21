'use client'

import { PlusIcon, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AGE_GROUP_LABELS, GENDER_LABELS, OCCUPATION_LABELS, PERSONALITY_LABELS } from '@/lib/enum-labels'
import { useStore } from '@/lib/store'
import { CharacterCreateDialog } from './character-create-dialog'

export default function CharactersPage() {
  const { characters } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">キャラクター一覧</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <PlusIcon className="size-4" />
          新規作成
        </Button>
      </div>

      {characters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <UserPlus className="size-10 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">キャラクターがまだ登録されていません</p>
              <p className="mt-1 text-sm">キャラクターを作成して、ボイスドラマの制作を始めましょう</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="mt-2 gap-1.5">
              <PlusIcon className="size-4" />
              最初のキャラクターを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((char) => (
            <Link key={char.id} href={`/characters/${char.id}`}>
              <Card className="transition-colors hover:border-primary/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                  <div className="size-4 rounded-full" style={{ backgroundColor: char.color }} />
                  <CardTitle className="text-base">{char.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {char.occupation && <Badge variant="secondary">{OCCUPATION_LABELS[char.occupation]}</Badge>}
                    <Badge variant="outline">{GENDER_LABELS[char.gender]}</Badge>
                    <Badge variant="outline">{AGE_GROUP_LABELS[char.ageGroup]}</Badge>
                  </div>
                  {char.personality.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {char.personality.map((p) => PERSONALITY_LABELS[p]).join('・')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CharacterCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
