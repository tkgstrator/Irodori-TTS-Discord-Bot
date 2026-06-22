import OpenAI from 'openai'
import { z } from 'zod'
import {
  buildChapterPlanPrompt,
  buildChapterPlanRepairPrompt,
  chapterPlanSystemInstruction
} from '@/lib/chapter-plan-prompt'
import { type ChapterPlan, ChapterPlanSchema } from '@/schemas/chapter-plan.dto'
import type { ChapterPlanRequest } from '@/schemas/chapter-plan-request.dto'
import { formatZodIssues, parseJsonText } from './llm-utils'

const LlmEnvSchema = z.object({
  LITELLM_BASE_URL: z.string().nonempty(),
  LITELLM_MASTER_KEY: z.string().nonempty()
})

const clientCache = new Map<'default', OpenAI>()

const getClient = () => {
  const envResult = LlmEnvSchema.safeParse(process.env)

  if (!envResult.success) {
    throw new Error('LITELLM_BASE_URL / LITELLM_MASTER_KEY is not set')
  }

  const cachedClient = clientCache.get('default')

  if (cachedClient) {
    return cachedClient
  }

  const createdClient = new OpenAI({
    baseURL: envResult.data.LITELLM_BASE_URL,
    apiKey: envResult.data.LITELLM_MASTER_KEY
  })
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

// LLM から返った JSON テキストを検証する。
export const parseChapterPlanText = ({ request, text }: { request: ChapterPlanRequest; text: string }): ChapterPlan => {
  const jsonResult = parseJsonText(text)
  const planResult = buildChapterPlanSchema(request).safeParse(jsonResult)

  if (!planResult.success) {
    throw new Error(`Invalid chapter plan response: ${formatZodIssues(planResult.error)}`)
  }

  return planResult.data
}

// ChapterPlanRequest を LLM に送り、章設計を生成する。
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

const generateChapterPlanText = async ({
  client,
  model,
  prompt
}: {
  client: OpenAI
  model: string
  prompt: string
}): Promise<string> => {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: chapterPlanSystemInstruction },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  })

  const text = response.choices[0]?.message?.content

  if (!text) {
    throw new Error('LLM returned empty response')
  }

  return text
}
