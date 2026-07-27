import { createContext, type ReactNode, use, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const STORAGE_KEY = 'irodori-dashboard-theme'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {}
})

/**
 * 保存済みのテーマを読み出す（既定はダーク）
 */
const readStoredTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' ? 'light' : 'dark'
}

/**
 * テーマを管理する Provider
 *
 * このダッシュボードはダークを既定とし、切り替えた場合のみ localStorage に残す。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>
}

/**
 * 現在のテーマと切り替え関数を取得する
 */
export const useTheme = (): ThemeContextValue => use(ThemeContext)
