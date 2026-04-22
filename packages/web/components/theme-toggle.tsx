'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const CYCLE: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
const ICONS = { light: Sun, dark: Moon, system: Monitor } as const
const LABELS = { light: 'ライトモード', dark: 'ダークモード', system: 'システム設定' } as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const Icon = ICONS[theme]
  const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length] ?? 'system'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10" onClick={() => setTheme(next)} aria-label={LABELS[theme]}>
          <Icon className="size-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{LABELS[theme]}</TooltipContent>
    </Tooltip>
  )
}
