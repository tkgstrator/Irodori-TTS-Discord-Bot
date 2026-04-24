import { makeApi, Zodios } from '@zodios/core'
import { z } from 'zod'
import { ChapterEpisodeRequestSchema } from '@/schemas/chapter-episode-request.dto'
import { ChapterPlanSchema } from '@/schemas/chapter-plan.dto'
import { ChapterPlanRequestSchema } from '@/schemas/chapter-plan-request.dto'
import { CharacterIdSchema, CharacterInputSchema, CharacterListSchema, CharacterSchema } from '@/schemas/character.dto'
import { ScenarioApiListSchema, ScenarioApiSchema } from '@/schemas/scenario-api.dto'
import {
  ScenarioAppendChapterApiSchema,
  ScenarioCreateApiSchema,
  ScenarioUpdateApiSchema
} from '@/schemas/scenario-write.dto'
import { SpeakerIdSchema, SpeakerImportListSchema, SpeakerImportTemplateSchema } from '@/schemas/speaker.dto'

// API エラーの標準レスポンスを定義する。
const ApiErrorSchema = z.object({
  error: z.string()
})

// ルートパラメータに使う ID を定義する。
const ScenarioIdSchema = z.string().uuid()
const ChapterIdSchema = z.string().uuid()

// クライアントエラーから UI 表示用メッセージを取り出す。
const ApiClientErrorSchema = z.object({
  response: z
    .object({
      data: z.unknown()
    })
    .optional(),
  message: z.string().optional()
})

// フロントエンド用の backend API 定義。
const backendApiDefinition = makeApi([
  {
    method: 'get',
    path: '/characters',
    alias: 'listCharacters',
    requestFormat: 'json',
    response: CharacterListSchema
  },
  {
    method: 'post',
    path: '/characters',
    alias: 'createCharacter',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CharacterInputSchema
      }
    ],
    response: CharacterSchema
  },
  {
    method: 'put',
    path: '/characters/:id',
    alias: 'updateCharacter',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: CharacterIdSchema
      },
      {
        name: 'body',
        type: 'Body',
        schema: CharacterInputSchema
      }
    ],
    response: CharacterSchema
  },
  {
    method: 'delete',
    path: '/characters/:id',
    alias: 'deleteCharacter',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: CharacterIdSchema
      }
    ],
    response: z.void()
  },
  {
    method: 'get',
    path: '/scenarios',
    alias: 'listScenarios',
    requestFormat: 'json',
    response: ScenarioApiListSchema
  },
  {
    method: 'get',
    path: '/scenarios/:id',
    alias: 'getScenario',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: ScenarioIdSchema
      }
    ],
    response: ScenarioApiSchema
  },
  {
    method: 'post',
    path: '/scenarios',
    alias: 'createScenario',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: ScenarioCreateApiSchema
      }
    ],
    response: ScenarioApiSchema
  },
  {
    method: 'put',
    path: '/scenarios/:id',
    alias: 'updateScenario',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: ScenarioIdSchema
      },
      {
        name: 'body',
        type: 'Body',
        schema: ScenarioUpdateApiSchema
      }
    ],
    response: ScenarioApiSchema
  },
  {
    method: 'post',
    path: '/scenarios/:id/chapters',
    alias: 'appendScenarioChapter',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: ScenarioIdSchema
      },
      {
        name: 'body',
        type: 'Body',
        schema: ScenarioAppendChapterApiSchema
      }
    ],
    response: ScenarioApiSchema
  },
  {
    method: 'post',
    path: '/scenarios/:id/chapters/:chapterId/create',
    alias: 'createScenarioEpisode',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: ScenarioIdSchema
      },
      {
        name: 'chapterId',
        type: 'Path',
        schema: ChapterIdSchema
      },
      {
        name: 'body',
        type: 'Body',
        schema: ChapterEpisodeRequestSchema
      }
    ],
    response: ScenarioApiSchema
  },
  {
    method: 'delete',
    path: '/scenarios/:id/chapters/:chapterId/episode',
    alias: 'deleteScenarioEpisode',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: ScenarioIdSchema
      },
      {
        name: 'chapterId',
        type: 'Path',
        schema: ChapterIdSchema
      }
    ],
    response: ScenarioApiSchema
  },
  {
    method: 'post',
    path: '/scenarios/:id/chapter-plan',
    alias: 'requestScenarioChapterPlan',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: ScenarioIdSchema
      },
      {
        name: 'body',
        type: 'Body',
        schema: ChapterPlanRequestSchema
      }
    ],
    response: ChapterPlanSchema
  },
  {
    method: 'get',
    path: '/speakers',
    alias: 'listSpeakerImports',
    requestFormat: 'json',
    response: SpeakerImportListSchema
  },
  {
    method: 'get',
    path: '/speakers/:speakerId/template',
    alias: 'getSpeakerTemplate',
    requestFormat: 'json',
    parameters: [
      {
        name: 'speakerId',
        type: 'Path',
        schema: SpeakerIdSchema
      }
    ],
    response: SpeakerImportTemplateSchema
  }
])

export const backendApi = new Zodios('/api', backendApiDefinition)

// Zodios エラーから API の error メッセージを優先して返す。
export const toApiError = (error: unknown, fallback: string) => new Error(readApiErrorMessage(error, fallback))

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
