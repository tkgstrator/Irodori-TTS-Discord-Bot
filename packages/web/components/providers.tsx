import type { ReactNode } from 'react'
import { LlmSettingsProvider } from '@/components/llm-settings-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LlmSettingsProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </LlmSettingsProvider>
    </ThemeProvider>
  )
}
