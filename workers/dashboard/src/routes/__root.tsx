import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { AudioLines, Moon, Sun } from 'lucide-react'
import { Toaster } from 'sonner'
import { ThemeProvider, useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { UserMenu } from '@/components/user-menu'
import { AppQueryProvider } from '@/lib/query-client'

const NAV_ITEMS = [
  { to: '/', label: 'ホーム' },
  { to: '/voice', label: '話者設定' }
] as const

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="テーマを切り替える">
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}

function AppShell() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div
        aria-hidden="true"
        className="-z-10 pointer-events-none fixed inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/10 to-transparent"
      />

      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <AudioLines className="size-4" />
            </span>
            <span className="font-brand text-base leading-none">Irodori TTS</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Button key={item.to} asChild variant="ghost" size="sm">
                <Link
                  to={item.to}
                  activeProps={{ className: 'bg-accent text-accent-foreground' }}
                  activeOptions={{ exact: item.to === '/' }}
                >
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
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
