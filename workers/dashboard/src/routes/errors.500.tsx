import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/errors/500')({
  beforeLoad: () => {
    throw new Error('エラーページの表示確認用エラーです')
  }
})
