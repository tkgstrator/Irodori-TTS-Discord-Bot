import OpenAI from 'openai'
import { z } from 'zod'

const LlmEnvSchema = z.object({
  LITELLM_BASE_URL: z.string().nonempty(),
  LITELLM_MASTER_KEY: z.string().nonempty()
})

const clientCache = new Map<'default', OpenAI>()

// LiteLLM 向けの OpenAI クライアントを生成・キャッシュして返す。
export const getClient = (): OpenAI => {
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
