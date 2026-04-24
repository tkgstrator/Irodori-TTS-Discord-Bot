import { z } from 'zod'

// テーマ設定で許可する値を定義する。
export const ThemeSchema = z.enum(['light', 'dark', 'system'])

export type Theme = z.infer<typeof ThemeSchema>
