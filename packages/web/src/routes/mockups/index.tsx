import { createFileRoute } from '@tanstack/react-router'
import { MockupsPage } from './-page'

export const Route = createFileRoute('/mockups/')({
  component: MockupsPage
})
