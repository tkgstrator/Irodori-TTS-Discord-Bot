'use client'

import type { CSSProperties, ReactNode } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar, MobileTabs } from './nav-bar'
import { TopBar } from './top-bar'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '240px',
          '--sidebar-width-icon': '72px',
          '--sidebar': 'var(--background)',
          '--sidebar-foreground': 'var(--foreground)',
          '--sidebar-border': 'var(--border)',
          '--sidebar-accent': 'var(--muted)',
          '--sidebar-accent-foreground': 'var(--foreground)'
        } as CSSProperties
      }
      className="flex min-h-screen flex-col bg-background text-foreground sm:h-screen sm:min-h-0"
    >
      <TopBar />
      <div className="flex flex-1 sm:min-h-0">
        <AppSidebar />
        <SidebarInset
          id="main-content"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background pb-[var(--mobile-nav-h)] sm:min-w-0 sm:pb-0 sm:pr-4"
        >
          {children}
        </SidebarInset>
      </div>
      <MobileTabs />
    </SidebarProvider>
  )
}
