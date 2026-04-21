'use client'

import { FileText, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStore } from '@/lib/store'
import { ScenarioCreateDialog } from './scenario-create-dialog'

export default function ScenariosPage() {
  const { scenarios, characters } = useStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  const resolveCharacterName = (id: string) => characters.find((c) => c.id === id)?.name ?? '不明'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">シナリオ一覧</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <PlusIcon className="size-4" />
          新規作成
        </Button>
      </div>

      {scenarios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <FileText className="size-10 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium">シナリオがまだ作成されていません</p>
              <p className="mt-1 text-sm">シナリオを作成して、キャラクターたちの物語を紡ぎましょう</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="mt-2 gap-1.5">
              <PlusIcon className="size-4" />
              最初のシナリオを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <Link key={scenario.id} href={`/scenarios/${scenario.id}`}>
              <Card className="transition-colors hover:border-primary/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{scenario.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scenario.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{scenario.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {scenario.characterIds.map((cid) => (
                      <Badge key={cid} variant="outline" className="text-xs">
                        {resolveCharacterName(cid)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ScenarioCreateDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
