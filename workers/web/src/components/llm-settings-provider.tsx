import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import {
  defaultLlmSettings,
  type GeminiModel,
  GeminiModelSchema,
  type LlmSettings,
  LlmSettingsSchema
} from '@/schemas/llm-settings.dto'

const llmSettingsStorageKey = 'irodori-llm-settings'

const LlmSettingsContext = createContext<{
  readonly llmSettings: LlmSettings
  readonly setEditorModel: (model: GeminiModel) => void
  readonly setWriterModel: (model: GeminiModel) => void
} | null>(null)

// ローカルストレージの設定文字列を安全に復元する。
const parseStoredLlmSettings = (storedValue: string | null): LlmSettings => {
  if (storedValue === null) {
    return defaultLlmSettings
  }

  try {
    const parsedValue = JSON.parse(storedValue)
    const parsedResult = LlmSettingsSchema.safeParse(parsedValue)

    if (parsedResult.success) {
      return parsedResult.data
    }

    console.warn('Invalid stored LLM settings detected')
    return defaultLlmSettings
  } catch {
    console.warn('Failed to parse stored LLM settings')
    return defaultLlmSettings
  }
}

// LLM 設定をアプリ全体に提供する。
export const LlmSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [llmSettings, setLlmSettings] = useState<LlmSettings>(() => {
    if (typeof window === 'undefined') {
      return defaultLlmSettings
    }

    return parseStoredLlmSettings(localStorage.getItem(llmSettingsStorageKey))
  })

  useEffect(() => {
    localStorage.setItem(llmSettingsStorageKey, JSON.stringify(llmSettings))
  }, [llmSettings])

  const value = useMemo(
    () => ({
      llmSettings,
      setEditorModel: (model: GeminiModel) => {
        const parsedResult = GeminiModelSchema.safeParse(model)

        if (!parsedResult.success) {
          throw new Error('Invalid editor Gemini model')
        }

        setLlmSettings((currentSettings) => ({
          ...currentSettings,
          editor: parsedResult.data
        }))
      },
      setWriterModel: (model: GeminiModel) => {
        const parsedResult = GeminiModelSchema.safeParse(model)

        if (!parsedResult.success) {
          throw new Error('Invalid writer Gemini model')
        }

        setLlmSettings((currentSettings) => ({
          ...currentSettings,
          writer: parsedResult.data
        }))
      }
    }),
    [llmSettings]
  )

  return <LlmSettingsContext.Provider value={value}>{children}</LlmSettingsContext.Provider>
}

// LLM 設定コンテキストを参照する。
export const useLlmSettings = () => {
  const context = useContext(LlmSettingsContext)

  if (context === null) {
    throw new Error('useLlmSettings must be used within LlmSettingsProvider')
  }

  return context
}
