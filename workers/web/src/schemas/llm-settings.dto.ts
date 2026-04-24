import { z } from 'zod'

// 設定画面から選択できる Gemini の文章生成モデルを定義する。
const GeminiModelValues = [
  'gemini-3.1-pro-preview',
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
] as const

export const GeminiModelSchema = z.enum(GeminiModelValues)

// Gemini モデルのメタデータ形式を定義する。
const GeminiModelItemSchema = z.object({
  value: GeminiModelSchema,
  label: z.string().nonempty(),
  release: z.enum(['Preview', 'GA', 'Legacy']),
  description: z.string().nonempty(),
  speedStars: z.number().int().min(1).max(5),
  accuracyStars: z.number().int().min(1).max(5),
  costStars: z.number().int().min(1).max(5)
})

// 設定画面で表示する Gemini モデル一覧を定義する。
const geminiModelCatalogResult = z.array(GeminiModelItemSchema).safeParse([
  {
    value: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro',
    release: 'Preview',
    description: '現行の最上位 reasoning 系です。長い文脈や難しい構成整理に向いています。',
    speedStars: 2,
    accuracyStars: 5,
    costStars: 1
  },
  {
    value: 'gemini-3-pro-preview',
    label: 'Gemini 3 Pro',
    release: 'Preview',
    description: '高度な推論と指示追従を重視した Pro 系です。複雑な生成に向いています。',
    speedStars: 3,
    accuracyStars: 5,
    costStars: 2
  },
  {
    value: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    release: 'Preview',
    description: '速度・精度・コストのバランスが良い汎用モデルです。',
    speedStars: 5,
    accuracyStars: 4,
    costStars: 4
  },
  {
    value: 'gemini-3.1-flash-lite-preview',
    label: 'Gemini 3.1 Flash-Lite',
    release: 'Preview',
    description: '低レイテンシと高スループット向けです。大量生成のコストを抑えやすいです。',
    speedStars: 5,
    accuracyStars: 3,
    costStars: 5
  },
  {
    value: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    release: 'GA',
    description: '安定版の Pro 系です。複雑な文章生成や長文の整合性で使いやすいです。',
    speedStars: 2,
    accuracyStars: 5,
    costStars: 2
  },
  {
    value: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    release: 'GA',
    description: '既定値として使いやすい、安定したバランス型モデルです。',
    speedStars: 4,
    accuracyStars: 4,
    costStars: 4
  },
  {
    value: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash-Lite',
    release: 'GA',
    description: '低コスト寄りの安定版です。高速な下書き生成に向いています。',
    speedStars: 5,
    accuracyStars: 3,
    costStars: 5
  },
  {
    value: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    release: 'Legacy',
    description: '旧世代の高速モデルです。互換性確認や比較用途向けです。',
    speedStars: 4,
    accuracyStars: 3,
    costStars: 4
  },
  {
    value: 'gemini-2.0-flash-lite',
    label: 'Gemini 2.0 Flash-Lite',
    release: 'Legacy',
    description: '旧世代の最軽量モデルです。最速・低コスト重視の比較候補です。',
    speedStars: 5,
    accuracyStars: 2,
    costStars: 5
  }
])

if (!geminiModelCatalogResult.success) {
  throw new Error('Invalid Gemini model catalog')
}

export const geminiModelCatalog = geminiModelCatalogResult.data

// LLM 設定の保存形式を定義する。
export const LlmSettingsSchema = z.object({
  editor: GeminiModelSchema,
  writer: GeminiModelSchema
})

// LLM リクエストで使うモデル指定形式を定義する。
export const LlmRequestModelSchema = z.object({
  editor: GeminiModelSchema,
  writer: GeminiModelSchema
})

// 設定未保存時の既定値を定義する。
const defaultLlmSettingsResult = LlmSettingsSchema.safeParse({
  editor: 'gemini-2.5-flash',
  writer: 'gemini-2.5-flash'
})

if (!defaultLlmSettingsResult.success) {
  throw new Error('Invalid default LLM settings')
}

export const defaultLlmSettings = defaultLlmSettingsResult.data

export type GeminiModel = z.infer<typeof GeminiModelSchema>
export type LlmSettings = z.infer<typeof LlmSettingsSchema>
