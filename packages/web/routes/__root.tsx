import { createRootRoute, ErrorComponent, Link, Outlet, useRouter } from '@tanstack/react-router'
import { AlertTriangle, FileQuestion, Home, RotateCcw } from 'lucide-react'
import { Providers } from '@/components/providers'
import { AppShell } from '@/components/shell/app-shell'
import { Button } from '@/components/ui/button'
import { CharactersProvider } from '@/lib/characters'
import '@/app/globals.css'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: RootErrorBoundary
})

function RootLayout() {
  return (
    <Providers>
      <CharactersProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </CharactersProvider>
    </Providers>
  )
}

function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="size-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">ページが見つかりません</h1>
        <p className="mt-2 text-sm text-muted-foreground">お探しのページは存在しないか、移動した可能性があります。</p>
      </div>
      <Button asChild variant="outline" size="lg">
        <Link to="/">
          <Home data-icon="inline-start" />
          ホームに戻る
        </Link>
      </Button>
    </div>
  )
}

function RootErrorBoundary({ error }: { error: unknown }) {
  const router = useRouter()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">エラーが発生しました</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          予期しないエラーが発生しました。再試行するか、ホームに戻ってください。
        </p>
      </div>
      <ErrorComponent error={error} />
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={() => router.invalidate()}>
          <RotateCcw data-icon="inline-start" />
          再試行
        </Button>
        <Button asChild size="lg">
          <Link to="/">
            <Home data-icon="inline-start" />
            ホームに戻る
          </Link>
        </Button>
      </div>
    </div>
  )
}
