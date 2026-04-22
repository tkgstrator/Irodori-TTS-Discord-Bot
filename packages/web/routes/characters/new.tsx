import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CharacterWizard, DEFAULT_VALUES } from '@/components/character-wizard'
import { SpeakerImportButton } from '@/components/speaker-import-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCharacters } from '@/lib/characters'

export const Route = createFileRoute('/characters/new')({
  component: CharacterNewPage
})

function CharacterNewPage() {
  const navigate = useNavigate()
  const { addCharacter } = useCharacters()

  return (
    <CharacterWizard
      title="キャラクター新規作成"
      subtitle="ウィザード形式で順番に設定します"
      submitLabel="作成する"
      defaultValues={DEFAULT_VALUES}
      stepOneActions={({ linkedSpeaker, applySpeakerTemplate, clearSpeaker, isSubmitting }) => (
        <div className="flex w-full flex-wrap items-center gap-2">
          <SpeakerImportButton disabled={isSubmitting} onImport={applySpeakerTemplate} />
          {linkedSpeaker && <Badge>{linkedSpeaker.name}</Badge>}
          {linkedSpeaker && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto border-destructive hover:border-destructive"
              onClick={clearSpeaker}
              disabled={isSubmitting}
            >
              連携解除
            </Button>
          )}
        </div>
      )}
      onSubmit={async (data, imageUrl) => {
        await addCharacter({ ...data, imageUrl })
        await navigate({ to: '/characters' })
      }}
      onCancel={() => navigate({ to: '/characters' })}
    />
  )
}
