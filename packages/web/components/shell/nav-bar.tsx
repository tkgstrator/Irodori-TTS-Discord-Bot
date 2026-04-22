import { Link, useLocation } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { BookOpen, Home, Layout, Network, Settings as SettingsIcon, Users } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  Icon: LucideIcon
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'ホーム', Icon: Home },
  { to: '/characters', label: 'キャラクター', Icon: Users },
  { to: '/plots', label: 'プロット', Icon: BookOpen },
  { to: '/relations', label: '相関図', Icon: Network }
] as const

const MOCKUPS_ITEM: NavItem = { to: '/mockups', label: 'モック', Icon: Layout } as const

const SETTINGS_ITEM: NavItem = { to: '/settings', label: '設定', Icon: SettingsIcon } as const

const ALL_ITEMS: readonly NavItem[] = [...NAV_ITEMS, MOCKUPS_ITEM, SETTINGS_ITEM]

function useIsActive() {
  const { pathname } = useLocation()

  return (item: NavItem): boolean => {
    if (item.to === '/') return pathname === '/'
    const matches = (route: string) => pathname === route || pathname.startsWith(`${route}/`)
    if (!matches(item.to)) return false
    return !ALL_ITEMS.some(
      (other) => other !== item && other.to.length > item.to.length && other.to.startsWith(item.to) && matches(other.to)
    )
  }
}

const MENU_BUTTON_CLS =
  'h-10 gap-6 [&>svg]:size-6 group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-2!'

const MENU_CONTAINER_CLS = 'px-4'

function renderItem(item: NavItem, isActiveFn: (item: NavItem) => boolean) {
  return (
    <SidebarMenuItem key={item.to}>
      <SidebarMenuButton asChild isActive={isActiveFn(item)} className={MENU_BUTTON_CLS}>
        <Link to={item.to}>
          <item.Icon aria-hidden="true" />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const isActive = useIsActive()

  return (
    <Sidebar collapsible="icon" className="top-14 h-[calc(100svh-3.5rem)]! border-r-0!">
      <SidebarContent>
        <SidebarGroup className={MENU_CONTAINER_CLS}>
          <SidebarMenu>{NAV_ITEMS.map((item) => renderItem(item, isActive))}</SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={MENU_CONTAINER_CLS}>
        <SidebarMenu>
          {renderItem(MOCKUPS_ITEM, isActive)}
          {renderItem(SETTINGS_ITEM, isActive)}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export function MobileTabs() {
  const isActive = useIsActive()

  return (
    <nav
      aria-label="モバイルナビゲーション"
      className="fixed bottom-0 left-0 right-0 z-[60] flex h-[var(--mobile-nav-h)] shrink-0 border-t border-border bg-card sm:hidden"
    >
      {ALL_ITEMS.map((item) => {
        const active = isActive(item)
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 bg-transparent text-[0.6875rem] font-bold text-muted-foreground no-underline transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm focus-visible:-outline-offset-[3px]',
              active && 'text-primary'
            )}
            aria-current={active ? 'page' : undefined}
          >
            {active && <span aria-hidden="true" className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-primary" />}
            <item.Icon aria-hidden="true" className="size-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
