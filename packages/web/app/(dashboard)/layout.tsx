'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

const PAGE_TITLES: Record<string, string> = {
  '/characters': 'キャラクター一覧',
  '/scenarios': 'シナリオ一覧',
  '/mockups': 'モック'
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          {pageTitle && <span className="text-sm font-medium">{pageTitle}</span>}
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
