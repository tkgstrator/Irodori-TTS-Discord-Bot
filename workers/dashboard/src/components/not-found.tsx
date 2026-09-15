import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-12">
      <div className="space-y-2">
        <p className="font-medium text-muted-foreground text-sm">404</p>
        <h1 className="font-semibold text-2xl tracking-tight">ページが見つかりません</h1>
        <p className="text-muted-foreground text-sm">指定されたページは存在しないか、移動した可能性があります。</p>
      </div>
      <Button asChild>
        <Link to="/">ホームへ戻る</Link>
      </Button>
    </div>
  )
}
