import { createFileRoute } from '@tanstack/react-router'
import { CharactersPage } from './-page'

export const Route = createFileRoute('/characters/')({
  component: CharactersPage
})
