import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Me } from '@/schemas/settings-api.dto'
import { backendApi, isUnauthorizedError, toApiError } from './backend-api'

export const authKeys = {
  me: ['auth', 'me'] as const
}

/**
 * ログイン中ユーザーを取得する
 *
 * 未ログイン（401）はエラーではなく `null` として扱い、
 * 画面側でログイン導線を出せるようにする。
 */
export const meQueryOptions = queryOptions({
  queryKey: authKeys.me,
  queryFn: async (): Promise<Me | null> => {
    try {
      return await backendApi.getMe()
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return null
      }
      throw toApiError(error, 'ログイン状態の取得に失敗しました')
    }
  },
  retry: false
})

/**
 * ログイン状態を購読する
 */
export const useMe = () => {
  const query = useQuery(meQueryOptions)
  return { ...query, me: query.data ?? null }
}

/**
 * ログアウトする
 */
export const useLogout = () => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      try {
        return await backendApi.logout(undefined)
      } catch (error) {
        throw toApiError(error, 'ログアウトに失敗しました')
      }
    },
    onSuccess: () => queryClient.invalidateQueries()
  })

  return { logout: mutation.mutateAsync, isLoggingOut: mutation.isPending }
}
