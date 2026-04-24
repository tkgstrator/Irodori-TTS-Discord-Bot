import { createFileRoute } from '@tanstack/react-router'
import { ScenarioEditPage } from '@/routes/scenarios/$id.edit'

export const Route = createFileRoute('/plots/$id/edit')({
  component: ScenarioEditPage
})
