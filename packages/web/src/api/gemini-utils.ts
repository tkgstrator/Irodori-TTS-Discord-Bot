import type { z } from 'zod'

// Gemini が返した JSON テキストを安全に parse する。
export const parseJsonText = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Gemini returned invalid JSON')
  }
}

// Zod の issue 群を短い 1 行メッセージへ整形する。
export const formatZodIssues = (error: z.ZodError): string =>
  error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
      return `${path}: ${issue.message}`
    })
    .join('; ')
