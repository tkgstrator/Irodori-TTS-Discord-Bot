import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { themeStorageKey } from '@/lib/theme'
import { type Theme, ThemeSchema } from '@/schemas/theme.dto'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'system', setTheme: () => {} })

// ローカルストレージに保存されたテーマ設定を安全に復元する。
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'system'
  }

  const storedTheme = localStorage.getItem(themeStorageKey)
  const storedThemeResult = ThemeSchema.safeParse(storedTheme)

  return storedThemeResult.success ? storedThemeResult.data : 'system'
}

// テーマ設定をアプリ全体へ提供する。
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return getStoredTheme()
  })

  useEffect(() => {
    const root = document.documentElement

    // HTML ルートへテーマクラスを反映する。
    const applyTheme = (t: Theme) => {
      if (t === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        root.classList.toggle('dark', prefersDark)
      } else {
        root.classList.toggle('dark', t === 'dark')
      }
    }

    applyTheme(theme)
    localStorage.setItem(themeStorageKey, theme)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>
}

export const useTheme = () => useContext(ThemeContext)
