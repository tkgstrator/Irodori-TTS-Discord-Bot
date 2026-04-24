import { createFileRoute } from '@tanstack/react-router'
import { PlotsPage } from './-page'

export const Route = createFileRoute('/plots/')({
  component: PlotsPage
})
