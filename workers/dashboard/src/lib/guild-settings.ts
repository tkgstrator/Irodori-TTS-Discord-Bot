import type { GuildSettings } from '@irodori-tts/shared/settings'
import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { backendApi, toApiError } from './backend-api'

export const guildKeys = {
  list: ['guilds'] as const,
  channels: (guildId: string) => ['guilds', guildId, 'channels'] as const,
  settings: (guildId: string) => ['guilds', guildId, 'settings'] as const
}

/**
 * 設定を変更できるギルド一覧を取得する
 */
export const guildsQueryOptions = queryOptions({
  queryKey: guildKeys.list,
  queryFn: async () => {
    try {
      return await backendApi.listGuilds()
    } catch (error) {
      throw toApiError(error, 'サーバー一覧の取得に失敗しました')
    }
  }
})

/**
 * ギルドのチャンネル一覧を取得する
 *
 * チャンネル名は Discord 側でしか解決できないため、Bot トークン未設定などで
 * 失敗しうる。呼び出し側は一覧なしでも操作できるようにする。
 */
export const guildChannelsQueryOptions = (guildId: string) =>
  queryOptions({
    queryKey: guildKeys.channels(guildId),
    queryFn: async () => {
      try {
        return await backendApi.listGuildChannels({ params: { guildId } })
      } catch (error) {
        throw toApiError(error, 'チャンネル一覧の取得に失敗しました')
      }
    },
    staleTime: 5 * 60 * 1000
  })

/**
 * ギルド設定を取得する
 */
export const guildSettingsQueryOptions = (guildId: string) =>
  queryOptions({
    queryKey: guildKeys.settings(guildId),
    queryFn: async () => {
      try {
        return await backendApi.getGuildSettings({ params: { guildId } })
      } catch (error) {
        throw toApiError(error, 'サーバー設定の取得に失敗しました')
      }
    }
  })

export const useSuspenseGuilds = () => {
  const query = useSuspenseQuery(guildsQueryOptions)
  return { ...query, guilds: query.data }
}

export const useSuspenseGuildSettings = (guildId: string) => {
  const query = useSuspenseQuery(guildSettingsQueryOptions(guildId))
  return { ...query, settings: query.data }
}

/**
 * チャンネル一覧は失敗しても画面全体を落とさないため Suspense を使わない
 */
export const useGuildChannels = (guildId: string) => {
  const query = useQuery(guildChannelsQueryOptions(guildId))
  return { ...query, channels: query.data }
}

/**
 * ギルド設定を更新するミューテーション
 */
export const useGuildSettingsMutations = (guildId: string) => {
  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: async (settings: GuildSettings) => {
      try {
        return await backendApi.setGuildSettings(settings, { params: { guildId } })
      } catch (error) {
        throw toApiError(error, 'サーバー設定の保存に失敗しました')
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: guildKeys.settings(guildId) })
  })

  return {
    saveSettings: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending
  }
}
