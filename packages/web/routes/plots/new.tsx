import { createFileRoute } from '@tanstack/react-router'
import { ScenarioNewPage } from '@/routes/scenarios/new'

export const Route = createFileRoute('/plots/new')({
  component: ScenarioNewPage
})
