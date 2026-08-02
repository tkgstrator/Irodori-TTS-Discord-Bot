import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ReactNode } from 'react'

/** localStorage に保存するキー。index.html の初期化スクリプトと合わせる */
export const THEME_STORAGE_KEY = 'irodori-dashboard-theme'

/**
 * テーマを管理する Provider
 *
 * このダッシュボードはダークを既定とし、`class` 属性で切り替える。
 * next-themes を使うことで shadcn 側の実装（sonner など）とも噛み合う。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
