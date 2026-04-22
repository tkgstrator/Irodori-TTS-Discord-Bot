import { createFileRoute } from '@tanstack/react-router'
import { ScenarioDetailPage } from '@/routes/scenarios/$id'

export const Route = createFileRoute('/plots/$id')({
  component: ScenarioDetailPage
})
