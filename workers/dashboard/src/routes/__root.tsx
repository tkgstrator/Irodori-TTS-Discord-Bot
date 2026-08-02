import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { AudioLines, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ThemeProvider } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UserMenu } from '@/components/user-menu'
import { AppQueryProvider } from '@/lib/query-client'

const NAV_ITEMS = [
  { to: '/', label: 'ホーム' },
  { to: '/voice', label: '話者設定' }
] as const

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="テーマを切り替える"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}

function AppShell() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div
        aria-hidden="true"
        className="-z-10 pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 to-transparent"
      />

      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-8 px-6">
          <Link to="/" className="flex items-center gap-2">
            <AudioLines className="size-5 text-primary" />
            <span className="font-brand font-semibold text-base leading-none tracking-tight">Irodori TTS</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="transition-colors hover:text-foreground"
                activeProps={{ className: 'font-medium text-foreground' }}
                inactiveProps={{ className: 'text-muted-foreground' }}
                activeOptions={{ exact: item.to === '/' }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <Outlet />
      </main>

      <Toaster position="bottom-right" richColors />
    </div>
  )
}

export const Route = createRootRoute({
  component: () => (
    <AppQueryProvider>
      <ThemeProvider>
        <TooltipProvider>
          <AppShell />
        </TooltipProvider>
      </ThemeProvider>
    </AppQueryProvider>
  )
})
