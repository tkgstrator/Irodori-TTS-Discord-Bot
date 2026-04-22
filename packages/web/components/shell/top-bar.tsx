'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 bg-background px-4">
      <SidebarTrigger className="hidden size-10 sm:inline-flex [&_svg]:size-6!" />
      <span className="text-[1.125rem] font-black tracking-tight text-foreground">PlotMaker</span>
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  )
}
