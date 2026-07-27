import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { Mic, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppQueryProvider } from '@/lib/query-client'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'ホーム', Icon: Settings },
  { to: '/voice', label: '話者設定', Icon: Mic }
] as const

function AppShell() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-6 py-4">
          <span className="font-brand text-lg">Irodori TTS</span>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Button key={item.to} asChild variant="ghost" size="sm">
                <Link
                  to={item.to}
                  activeProps={{ className: cn('bg-accent text-accent-foreground') }}
                  activeOptions={{ exact: item.to === '/' }}
                >
                  <item.Icon aria-hidden="true" className="size-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export const Route = createRootRoute({
  component: () => (
    <AppQueryProvider>
      <AppShell />
    </AppQueryProvider>
  )
})
