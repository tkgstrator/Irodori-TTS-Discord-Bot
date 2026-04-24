import { queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { backendApi, toApiError } from './backend-api'

/**
 * 話者候補一覧の query key を定義する。
 */
export const speakerKeys = {
  all: ['speakers'] as const
}

/**
 * 話者候補一覧取得の query options を定義する。
 */
export const speakerImportsQueryOptions = queryOptions({
  queryKey: speakerKeys.all,
  queryFn: async () => {
    try {
      return await backendApi.listSpeakerImports()
    } catch (error) {
      throw toApiError(error, 'Failed to load speakers')
    }
  }
})

/**
 * 話者候補一覧を Suspense で取得する。
 */
export const useSuspenseSpeakerImports = () => {
  const query = useSuspenseQuery(speakerImportsQueryOptions)

  return {
    ...query,
    speakerItems: query.data
  }
}

/**
 * 話者テンプレート取得 mutation を提供する。
 */
export const useSpeakerTemplateMutation = () =>
  useMutation({
    mutationFn: async (speakerId: string) => {
      try {
        return await backendApi.getSpeakerTemplate({
          params: {
            speakerId
          }
        })
      } catch (error) {
        throw toApiError(error, 'Failed to import speaker template')
      }
    }
  })
