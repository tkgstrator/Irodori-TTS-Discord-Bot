import { z } from 'zod'

// LiteLLM 経由で利用可能なモデルを定義する。
const LlmModelValues = [
  'gemini-3.1-pro-preview',
  'gemini-3.1-pro-preview-search',
  'gemini-3-pro-preview',
  'gemini-3-pro-preview-search',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gpt-5.5',
  'gpt-5.1',
  'gpt-5.1-mini',
  'gpt-5.1-codex',
  'gpt-5.1-codex-mini',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
  'gpt-5-mini',
  'gpt-5-nano',
  'qwen36-35b-claude',
  'qwen36-27b',
  'gemma4-31b'
] as const

export const LlmModelSchema = z.enum(LlmModelValues)

// モデルのカテゴリを定義する。
const LlmModelCategoryValues = ['Gemini', 'GPT', 'Qwen', 'Gemma'] as const
export const LlmModelCategorySchema = z.enum(LlmModelCategoryValues)
export type LlmModelCategory = z.infer<typeof LlmModelCategorySchema>

// モデルのメタデータ形式を定義する。
const LlmModelItemSchema = z.object({
  value: LlmModelSchema,
  label: z.string().nonempty(),
  category: LlmModelCategorySchema,
  release: z.enum(['Preview', 'GA', 'Legacy']),
  description: z.string().nonempty(),
  speed: z.number().int().min(1).max(5),
  accuracy: z.number().int().min(1).max(5),
  cost: z.number().int().min(1).max(5),
  flexibility: z.number().int().min(1).max(5)
})

// 設定画面で表示するモデル一覧を定義する。
const llmModelCatalogResult = z.array(LlmModelItemSchema).safeParse([
  {
    value: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro',
    category: 'Gemini',
    release: 'Preview',
    description: '現行の最上位 reasoning 系です。長い文脈や難しい構成整理に向いています。',
    speed: 2,
    accuracy: 5,
    cost: 1,
    flexibility: 4
  },
  {
    value: 'gemini-3.1-pro-preview-search',
    label: 'Gemini 3.1 Pro + Search',
    category: 'Gemini',
    release: 'Preview',
    description: 'Gemini 3.1 Pro にウェブ検索グラウンディングを追加したモデルです。',
    speed: 1,
    accuracy: 5,
    cost: 1,
    flexibility: 4
  },
  {
    value: 'gemini-3-pro-preview',
    label: 'Gemini 3 Pro',
    category: 'Gemini',
    release: 'Preview',
    description: '高度な推論と指示追従を重視した Pro 系です。複雑な生成に向いています。',
    speed: 3,
    accuracy: 5,
    cost: 2,
    flexibility: 4
  },
  {
    value: 'gemini-3-pro-preview-search',
    label: 'Gemini 3 Pro + Search',
    category: 'Gemini',
    release: 'Preview',
    description: 'Gemini 3 Pro にウェブ検索グラウンディングを追加したモデルです。',
    speed: 2,
    accuracy: 5,
    cost: 2,
    flexibility: 4
  },
  {
    value: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    category: 'Gemini',
    release: 'Preview',
    description: '速度・精度・コストのバランスが良い汎用モデルです。',
    speed: 5,
    accuracy: 4,
    cost: 4,
    flexibility: 4
  },
  {
    value: 'gemini-3.1-flash-lite-preview',
    label: 'Gemini 3.1 Flash-Lite',
    category: 'Gemini',
    release: 'Preview',
    description: '低レイテンシと高スループット向けです。大量生成のコストを抑えやすいです。',
    speed: 5,
    accuracy: 3,
    cost: 5,
    flexibility: 4
  },
  {
    value: 'gpt-5.5',
    label: 'GPT-5.5',
    category: 'GPT',
    release: 'GA',
    description: 'OpenAI の最上位モデルです。高精度な文章生成に向いています。',
    speed: 1,
    accuracy: 5,
    cost: 1,
    flexibility: 2
  },
  {
    value: 'gpt-5.1',
    label: 'GPT-5.1',
    category: 'GPT',
    release: 'GA',
    description: '高い推論能力と指示追従性を持つ汎用モデルです。',
    speed: 2,
    accuracy: 5,
    cost: 2,
    flexibility: 2
  },
  {
    value: 'gpt-5.1-mini',
    label: 'GPT-5.1 Mini',
    category: 'GPT',
    release: 'GA',
    description: 'GPT-5.1 の軽量版です。速度とコストのバランスが良いです。',
    speed: 4,
    accuracy: 4,
    cost: 4,
    flexibility: 2
  },
  {
    value: 'gpt-5.1-codex',
    label: 'GPT-5.1 Codex',
    category: 'GPT',
    release: 'GA',
    description: 'コード生成に特化したモデルです。構造化出力に強いです。',
    speed: 3,
    accuracy: 4,
    cost: 3,
    flexibility: 2
  },
  {
    value: 'gpt-5.1-codex-mini',
    label: 'GPT-5.1 Codex Mini',
    category: 'GPT',
    release: 'GA',
    description: 'Codex の軽量版です。構造化出力を高速に生成します。',
    speed: 4,
    accuracy: 3,
    cost: 4,
    flexibility: 2
  },
  {
    value: 'gpt-5.4-mini',
    label: 'GPT-5.4 Mini',
    category: 'GPT',
    release: 'GA',
    description: '新しい世代の軽量モデルです。速度と品質のバランスが向上しています。',
    speed: 4,
    accuracy: 4,
    cost: 4,
    flexibility: 2
  },
  {
    value: 'gpt-5.4-nano',
    label: 'GPT-5.4 Nano',
    category: 'GPT',
    release: 'GA',
    description: '最小クラスの GPT です。低コストで高速な生成が可能です。',
    speed: 5,
    accuracy: 3,
    cost: 5,
    flexibility: 2
  },
  {
    value: 'gpt-5-mini',
    label: 'GPT-5 Mini',
    category: 'GPT',
    release: 'GA',
    description: 'GPT-5 系の軽量モデルです。汎用的な生成タスクに使えます。',
    speed: 4,
    accuracy: 4,
    cost: 4,
    flexibility: 2
  },
  {
    value: 'gpt-5-nano',
    label: 'GPT-5 Nano',
    category: 'GPT',
    release: 'GA',
    description: 'GPT-5 系の最小モデルです。大量生成のコストを抑えやすいです。',
    speed: 5,
    accuracy: 3,
    cost: 5,
    flexibility: 2
  },
  {
    value: 'qwen36-35b-claude',
    label: 'Qwen3.6 35B-A3B',
    category: 'Qwen',
    release: 'GA',
    description: 'MoE 構成（35B/A3B）の軽量高速モデルです。コスト重視の生成に向いています。',
    speed: 5,
    accuracy: 3,
    cost: 5,
    flexibility: 5
  },
  {
    value: 'qwen36-27b',
    label: 'Qwen3.6 27B',
    category: 'Qwen',
    release: 'GA',
    description: '27B デンスモデルです。精度と速度のバランスが良い汎用モデルです。',
    speed: 3,
    accuracy: 4,
    cost: 3,
    flexibility: 5
  },
  {
    value: 'gemma4-31b',
    label: 'Gemma 4 31B',
    category: 'Gemma',
    release: 'GA',
    description: 'Google の軽量オープンモデルです。日本語の文章生成にも対応しています。',
    speed: 3,
    accuracy: 4,
    cost: 4,
    flexibility: 5
  }
])

if (!llmModelCatalogResult.success) {
  throw new Error('Invalid LLM model catalog')
}

export const llmModelCatalog = llmModelCatalogResult.data

// LLM 設定の保存形式を定義する。
export const LlmSettingsSchema = z.object({
  editor: LlmModelSchema,
  writer: LlmModelSchema
})

// LLM リクエストで使うモデル指定形式を定義する。
export const LlmRequestModelSchema = z.object({
  editor: LlmModelSchema,
  writer: LlmModelSchema
})

// 設定未保存時の既定値を定義する。
const defaultLlmSettingsResult = LlmSettingsSchema.safeParse({
  editor: 'gemini-3-flash-preview',
  writer: 'gemini-3-flash-preview'
})

if (!defaultLlmSettingsResult.success) {
  throw new Error('Invalid default LLM settings')
}

export const defaultLlmSettings = defaultLlmSettingsResult.data

// DB から読んだモデル名が旧値でも安全にフォールバックする。
export const normalizeLlmModel = (value: string): LlmModel =>
  LlmModelSchema.catch(defaultLlmSettings.editor).parse(value)

// カテゴリごとにグルーピングされたモデル一覧を返す。
export const llmModelCatalogByCategory = LlmModelCategoryValues.map((category) => ({
  category,
  models: llmModelCatalog.filter((item) => item.category === category)
})).filter((group) => group.models.length > 0)

export type LlmModel = z.infer<typeof LlmModelSchema>
export type LlmSettings = z.infer<typeof LlmSettingsSchema>
