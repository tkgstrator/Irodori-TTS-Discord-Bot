import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import {
  buildChapterPlanPrompt,
  buildChapterPlanRepairPrompt,
  chapterPlanSystemInstruction
} from '@/lib/chapter-plan-prompt'
import { type ChapterPlan, ChapterPlanSchema } from '@/schemas/chapter-plan.dto'
import type { ChapterPlanRequest } from '@/schemas/chapter-plan-request.dto'
import { formatZodIssues, parseJsonText } from './gemini-utils'

// Gemini 利用時に必要な環境変数を定義する。
const GeminiEnvSchema = z.object({
  GEMINI_API_KEY: z.string().nonempty()
})

// Gemini クライアントをシングルトンで保持する。
const clientCache = new Map<'default', GoogleGenAI>()

// Gemini クライアントを取得する。
const getClient = () => {
  const envResult = GeminiEnvSchema.safeParse(process.env)

  if (!envResult.success) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const cachedClient = clientCache.get('default')

  if (cachedClient) {
    return cachedClient
  }

  const createdClient = new GoogleGenAI({ apiKey: envResult.data.GEMINI_API_KEY })
  clientCache.set('default', createdClient)
  return createdClient
}

// request 依存の整合も含めた章計画スキーマを組み立てる。
const buildChapterPlanSchema = (request: ChapterPlanRequest) =>
  ChapterPlanSchema.superRefine((data, ctx) => {
    if (data.dramaId !== request.dramaId) {
      ctx.addIssue({
        code: 'custom',
        path: ['dramaId'],
        message: 'Chapter plan dramaId mismatch'
      })
    }

    if (data.chapter.number !== request.request.nextChapterNumber) {
      ctx.addIssue({
        code: 'custom',
        path: ['chapter', 'number'],
        message: 'Chapter plan number mismatch'
      })
    }
  })

// Gemini から返った JSON テキストを検証する。
export const parseChapterPlanText = ({ request, text }: { request: ChapterPlanRequest; text: string }): ChapterPlan => {
  const jsonResult = parseJsonText(text)
  const planResult = buildChapterPlanSchema(request).safeParse(jsonResult)

  if (!planResult.success) {
    throw new Error(`Invalid chapter plan response: ${formatZodIssues(planResult.error)}`)
  }

  return planResult.data
}

// ChapterPlanRequest を Gemini に送り、章設計を生成する。
export const planChapter = async (request: ChapterPlanRequest): Promise<ChapterPlan> => {
  const client = getClient()
  const responseText = await generateChapterPlanText({
    client,
    model: request.model.editor,
    prompt: buildChapterPlanPrompt(request)
  })

  try {
    return parseChapterPlanText({
      request,
      text: responseText
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid chapter plan response'
    const repairedText = await generateChapterPlanText({
      client,
      model: request.model.editor,
      prompt: buildChapterPlanRepairPrompt({
        request,
        responseText,
        errorMessage
      })
    })

    return parseChapterPlanText({
      request,
      text: repairedText
    })
  }
}

// Gemini に JSON mode で章計画を生成させる。
const generateChapterPlanText = async ({
  client,
  model,
  prompt
}: {
  client: GoogleGenAI
  model: string
  prompt: string
}): Promise<string> => {
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: chapterPlanSystemInstruction,
      responseMimeType: 'application/json'
    }
  })

  if (!response.text) {
    throw new Error('Gemini returned empty response')
  }

  return response.text
}
