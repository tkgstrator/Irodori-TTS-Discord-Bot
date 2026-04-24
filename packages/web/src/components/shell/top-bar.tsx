import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarTrigger } from '@/components/ui/sidebar'

// アプリ全体で共通利用するトップバーを描画する。
export const TopBar = () => {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 bg-background px-4">
      <SidebarTrigger className="hidden size-10 sm:inline-flex [&_svg]:size-6!" />
      <div className="flex flex-col justify-center leading-none">
        <span className="font-brand text-[1.2rem] font-semibold tracking-[-0.02em] text-foreground">PlotMaker</span>
        <span className="text-[0.68rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Story Studio
        </span>
      </div>
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  )
}
