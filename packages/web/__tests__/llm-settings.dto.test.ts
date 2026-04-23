import { describe, expect, test } from 'bun:test'
import {
  defaultLlmSettings,
  GeminiModelSchema,
  geminiModelCatalog,
  LlmSettingsSchema
} from '../schemas/llm-settings.dto'

describe('LlmSettingsSchema', () => {
  test('Gemini モデルの既定値を受け入れる', () => {
    const result = LlmSettingsSchema.safeParse(defaultLlmSettings)

    expect(result.success).toBe(true)
  })

  test('Editor と Writer で別モデルを受け入れる', () => {
    const result = LlmSettingsSchema.safeParse({
      editorModel: 'gemini-3.1-pro-preview',
      writerModel: 'gemini-3-flash-preview'
    })

    expect(result.success).toBe(true)
  })

  test('Gemini の文章生成モデルを一覧表示用に保持する', () => {
    expect(geminiModelCatalog.length).toBe(9)
    expect(geminiModelCatalog.some((item) => item.value === 'gemini-3.1-pro-preview')).toBe(true)
    expect(geminiModelCatalog.some((item) => item.value === 'gemini-2.0-flash-lite')).toBe(true)
  })

  test('Gemini 以外のモデルは拒否する', () => {
    const result = GeminiModelSchema.safeParse('gpt-5')

    expect(result.success).toBe(false)
  })
})
