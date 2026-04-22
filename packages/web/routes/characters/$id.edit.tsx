import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type CharacterFormValues, CharacterWizard } from '@/components/character-wizard'
import { useCharacters } from '@/lib/characters'

export const Route = createFileRoute('/characters/$id/edit')({
  component: CharacterEditPage
})

function CharacterEditPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { getCharacter, updateCharacter } = useCharacters()
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
    memo: character.memo
  }

  return (
    <CharacterWizard
      title="キャラクター編集"
      subtitle={`${character.name} の情報を編集します`}
      submitLabel="保存する"
      defaultValues={defaultValues}
      initialImageUrl={character.imageUrl}
      onSubmit={(data, imageUrl) => {
        updateCharacter(id, { ...data, imageUrl })
        navigate({ to: '/characters' })
      }}
      onCancel={() => navigate({ to: '/characters' })}
    />
  )
}
