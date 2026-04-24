import { createFileRoute } from '@tanstack/react-router'
import { ChapterPlanPreviewPage } from '../scenarios/$id.chapter-plan'

export const Route = createFileRoute('/plots/$id/chapter-plan')({
  component: ChapterPlanPreviewPage
})
