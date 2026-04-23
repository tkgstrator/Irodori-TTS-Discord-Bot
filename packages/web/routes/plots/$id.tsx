import { createFileRoute } from '@tanstack/react-router'
import { ScenarioDetailPage } from '../scenarios/$id'

export const Route = createFileRoute('/plots/$id')({
  component: ScenarioDetailPage
})
