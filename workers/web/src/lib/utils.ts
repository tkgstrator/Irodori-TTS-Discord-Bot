import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// TTS の感情/演出ショートコード (`{sigh}`, `{angry}` 等) を表示用に除去する。
// 先頭に付く場合は後続の空白も落とす。
export const stripTtsShortcodes = (text: string): string =>
  text.replace(/\{[a-z_]+\}\s*/g, '').trim()
