import { createFileRoute } from '@tanstack/react-router'
import { ScenariosPage } from './-page'

export const Route = createFileRoute('/scenarios/')({
  component: ScenariosPage
})
