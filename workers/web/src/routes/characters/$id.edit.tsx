import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CharacterWizard } from '@/components/character-wizard'
import { PageSuspense } from '@/components/page-suspense'
import { SpeakerImportButton } from '@/components/speaker-import-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCharacterMutations, useSuspenseCharacters } from '@/lib/characters'
import type { CharacterFormValues } from '@/schemas/character.dto'

const CharacterEditPageContent = () => {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { getCharacter } = useSuspenseCharacters()
  const { updateCharacter } = useCharacterMutations()
  const character = getCharacter(id)

  if (!character) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">キャラクターが見つかりません</p>
      </div>
    )
  }

  const defaultValues: CharacterFormValues = {
    name: character.name,
    ageGroup: character.ageGroup,
    gender: character.gender,
    occupation: character.occupation,
    personalityTags: [...character.personalityTags],
    speechStyle: character.speechStyle,
    firstPerson: character.firstPerson,
    secondPerson: character.secondPerson,
    honorific: character.honorific,
    attributeTags: [...character.attributeTags],
    backgroundTags: [...character.backgroundTags],
    sampleQuotes: [...character.sampleQuotes],
    memo: character.memo,
    speakerId: character.speakerId,
    caption: character.caption
  }

  return (
    <CharacterWizard
      title="キャラクター編集"
      subtitle={`${character.name} の情報を編集します`}
      submitLabel="保存する"
      defaultValues={defaultValues}
      initialImageUrl={character.imageUrl}
      initialSpeaker={character.speaker}
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
        await updateCharacter(id, { ...data, imageUrl })
        await navigate({ to: '/characters' })
      }}
      onCancel={() => navigate({ to: '/characters' })}
    />
  )
}

const CharacterEditPage = () => (
  <PageSuspense label="キャラクターを読み込み中です">
    <CharacterEditPageContent />
  </PageSuspense>
)

export const Route = createFileRoute('/characters/$id/edit')({
  component: CharacterEditPage
})
