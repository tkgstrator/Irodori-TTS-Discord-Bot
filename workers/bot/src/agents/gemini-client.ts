import { GoogleGenAI } from '@google/genai'
import type { z } from 'zod'
import { config } from '../config'

/**
 * Gemini の JSON mode を使った汎用ラッパ。
 *
 * Gemini の `responseSchema`（OpenAPI 3.0 subset）は Zod の `.strict()` や
 * `z.discriminatedUnion` 等を正しく表現できないことがあるため、
 * v1 では **JSON mode（`responseMimeType: 'application/json'`）のみ** を使い、
 * Zod で返り値を検証する単層設計にする。
 *
 * 出力形式は `systemInstruction` / `prompt` 側でしっかり指定する前提。
 */

/**
 * クライアントのシングルトン。`GEMINI_API_KEY` が設定されている時だけ初期化する。
 * `let` を避けるため Map でキャッシュしている。
 */
const clientCache = new Map<'default', GoogleGenAI>()

const getClient = (): GoogleGenAI => {
  if (!config.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  const cached = clientCache.get('default')
  if (cached !== undefined) return cached
  const created = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY })
  clientCache.set('default', created)
  return created
}

export type GenerateStructuredOptions<T> = {
  prompt: string
  schema: z.ZodType<T>
  systemInstruction?: string
  model?: string
  /** レスポンスの生テキストを保存するファイルパス（任意）。デバッグ用。 */
  dumpRawTo?: string
}

/**
 * Gemini に JSON を生成させて Zod で検証する。
 *
 * `dumpRawTo` が指定されると、Gemini の生テキスト（Zod 検証前の JSON 文字列）を
 * そのパスに書き出す。失敗時も同じパスに書き出されるので、検証エラーの原因を
 * 後から確認できる。
 *
 * @throws Zod バリデーションに失敗した場合、`ZodError` を投げる。
 * @throws Gemini が空レスポンスを返した場合、`Error` を投げる。
 * @throws Gemini が非 JSON を返した場合、`Error` を投げる。
 */
export const generateStructured = async <T>({
  prompt,
  schema,
  systemInstruction,
  model = config.GEMINI_MODEL,
  dumpRawTo
}: GenerateStructuredOptions<T>): Promise<T> => {
  const ai = getClient()

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      ...(systemInstruction !== undefined && { systemInstruction }),
      responseMimeType: 'application/json'
    }
  })

  const text = response.text
  if (dumpRawTo !== undefined && text !== undefined) {
    await Bun.write(dumpRawTo, text)
  }
  if (!text) {
    throw new Error('Gemini returned empty response')
  }

  const parsed = parseJsonOrThrow(text)
  return schema.parse(parsed)
}

/** `let` を使わずに try/catch 結果を返すためのヘルパ。 */
const parseJsonOrThrow = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch (err) {
    throw new Error(`Gemini returned non-JSON response: ${String(err)}\n--- raw ---\n${text}`)
  }
}
