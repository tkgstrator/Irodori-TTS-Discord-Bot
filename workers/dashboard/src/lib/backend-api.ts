import { SpeakerConfigSchema, UserSettingsSchema } from '@irodori-tts/shared/settings'
import { makeApi, Zodios } from '@zodios/core'
import { z } from 'zod'
import { CurrentSpeakerInputSchema, MeSchema, SpeakerListSchema } from '@/schemas/settings-api.dto'

// API エラーの標準レスポンス
const ApiErrorSchema = z.object({
  error: z.string()
})

// クライアントエラーから UI 表示用メッセージを取り出すためのスキーマ
const ApiClientErrorSchema = z.object({
  response: z
    .object({
      status: z.number().optional(),
      data: z.unknown()
    })
    .optional(),
  message: z.string().optional()
})

const backendApiDefinition = makeApi([
  {
    method: 'get',
    path: '/auth/me',
    alias: 'getMe',
    requestFormat: 'json',
    response: MeSchema
  },
  {
    method: 'post',
    path: '/auth/logout',
    alias: 'logout',
    requestFormat: 'json',
    response: z.object({ ok: z.boolean() })
  },
  {
    method: 'get',
    path: '/speakers',
    alias: 'listSpeakers',
    requestFormat: 'json',
    response: SpeakerListSchema
  },
  {
    method: 'get',
    path: '/me/settings',
    alias: 'getMySettings',
    requestFormat: 'json',
    response: UserSettingsSchema
  },
  {
    method: 'put',
    path: '/me/settings/speaker',
    alias: 'setCurrentSpeaker',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CurrentSpeakerInputSchema
      }
    ],
    response: UserSettingsSchema
  },
  {
    method: 'put',
    path: '/me/settings/speakers/:speakerId',
    alias: 'setSpeakerConfig',
    requestFormat: 'json',
    parameters: [
      {
        name: 'speakerId',
        type: 'Path',
        schema: z.string().nonempty()
      },
      {
        name: 'body',
        type: 'Body',
        schema: SpeakerConfigSchema
      }
    ],
    response: SpeakerConfigSchema
  },
  {
    method: 'delete',
    path: '/me/settings/speakers/:speakerId',
    alias: 'clearSpeakerConfig',
    requestFormat: 'json',
    parameters: [
      {
        name: 'speakerId',
        type: 'Path',
        schema: z.string().nonempty()
      }
    ],
    response: UserSettingsSchema
  }
])

export const backendApi = new Zodios('/api', backendApiDefinition)

/**
 * エラーが未ログイン（401）由来かを判定する
 */
export const isUnauthorizedError = (error: unknown): boolean => {
  const parsed = ApiClientErrorSchema.safeParse(error)
  return parsed.success && parsed.data.response?.status === 401
}

/**
 * API エラーから UI 表示用のメッセージを取り出す
 */
export const readApiErrorMessage = (error: unknown, fallback: string): string => {
  const clientErrorResult = ApiClientErrorSchema.safeParse(error)

  if (clientErrorResult.success) {
    const apiErrorResult = ApiErrorSchema.safeParse(clientErrorResult.data.response?.data)

    if (apiErrorResult.success) {
      return apiErrorResult.data.error
    }

    if (clientErrorResult.data.message) {
      return clientErrorResult.data.message
    }
  }

  return error instanceof Error ? error.message : fallback
}

/**
 * API エラーを Error に正規化する
 */
export const toApiError = (error: unknown, fallback: string) => new Error(readApiErrorMessage(error, fallback))
