import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/errors/404')({
  beforeLoad: () => {
    throw notFound()
  }
})
