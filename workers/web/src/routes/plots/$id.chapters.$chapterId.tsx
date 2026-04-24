import { createFileRoute } from '@tanstack/react-router'
import { ChapterDetailPage } from '@/routes/scenarios/$id.chapters.$chapterId'

export const Route = createFileRoute('/plots/$id/chapters/$chapterId')({
  component: ChapterDetailPage
})
