'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'

const CYCLE: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
const ICONS = { light: Sun, dark: Moon, system: Monitor } as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = ICONS[theme]
  const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length] ?? 'system'

  return (
    <Button variant="ghost" size="icon-sm" onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`}>
      <Icon className="size-4" />
    </Button>
  )
}
