import { describe, expect, test } from 'bun:test'
import { defaultLlmSettings, LlmModelSchema, LlmSettingsSchema, llmModelCatalog } from '../src/schemas/llm-settings.dto'

describe('LlmSettingsSchema', () => {
  test('LLM モデルの既定値を受け入れる', () => {
    const result = LlmSettingsSchema.safeParse(defaultLlmSettings)

    expect(result.success).toBe(true)
  })

  test('Editor と Writer で別モデルを受け入れる', () => {
    const result = LlmSettingsSchema.safeParse({
      editor: 'gemini-3.1-pro-preview',
      writer: 'gemini-3-flash-preview'
    })

    expect(result.success).toBe(true)
  })

  test('LLM モデルを一覧表示用に保持する', () => {
    expect(llmModelCatalog.length).toBe(18)
    expect(llmModelCatalog.some((item) => item.value === 'gemini-3.1-pro-preview')).toBe(true)
    expect(llmModelCatalog.some((item) => item.value === 'gemini-3-flash-preview')).toBe(true)
    expect(llmModelCatalog.some((item) => item.value === 'gpt-5.5')).toBe(true)
    expect(llmModelCatalog.some((item) => item.value === 'qwen36-27b')).toBe(true)
    expect(llmModelCatalog.some((item) => item.value === 'gemma4-31b')).toBe(true)
  })

  test('��登録モデルは拒否する', () => {
    const result = LlmModelSchema.safeParse('gpt-5')

    expect(result.success).toBe(false)
  })
})
