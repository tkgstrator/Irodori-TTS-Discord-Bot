import type { LucideIcon } from 'lucide-react'
import { Monitor, Moon, Sun } from 'lucide-react'
import type { Theme } from '@/schemas/theme.dto'

// テーマ設定の保存先キーを共有する。
export const themeStorageKey = 'irodori-theme'

// テーマ切り替えの巡回順を定義する。
const themeCycle: ReadonlyArray<Theme> = ['light', 'dark', 'system']

// テーマごとの表示名を管理する。
export const themeLabels: Record<Theme, string> = {
  light: 'ライトモード',
  dark: 'ダークモード',
  system: 'システム設定'
}

// テーマごとのアイコンを管理する。
export const themeIcons: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor
}

// 現在のテーマから次のテーマを返す。
export const getNextTheme = (theme: Theme): Theme => {
  const nextIndex = (themeCycle.indexOf(theme) + 1) % themeCycle.length

  return themeCycle[nextIndex] ?? 'system'
}
