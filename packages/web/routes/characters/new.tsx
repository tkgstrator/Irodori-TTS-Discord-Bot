import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CharacterWizard, DEFAULT_VALUES } from '@/components/character-wizard'
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
      onSubmit={(data, imageUrl) => {
        addCharacter({ ...data, imageUrl })
        navigate({ to: '/characters' })
      }}
      onCancel={() => navigate({ to: '/characters' })}
    />
  )
}
