import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function ErrorBoundary({ reset }: ErrorComponentProps) {
  return (
    <div className="flex flex-col items-start gap-4 py-12">
      <div className="space-y-2">
        <p className="font-medium text-muted-foreground text-sm">500</p>
        <h1 className="font-semibold text-2xl tracking-tight">問題が発生しました</h1>
        <p className="text-muted-foreground text-sm">ページを表示できませんでした。もう一度お試しください。</p>
      </div>
      <Button onClick={reset}>再試行</Button>
    </div>
  )
}
