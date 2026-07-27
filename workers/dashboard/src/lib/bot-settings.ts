import type { SpeakerConfig } from '@irodori-tts/shared/settings'
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { backendApi, toApiError } from './backend-api'

export const botSettingsKeys = {
  settings: ['bot', 'settings'] as const,
  speakers: ['bot', 'speakers'] as const
}

/**
 * 自分のBot設定を取得する
 */
export const mySettingsQueryOptions = queryOptions({
  queryKey: botSettingsKeys.settings,
  queryFn: async () => {
    try {
      return await backendApi.getMySettings()
    } catch (error) {
      throw toApiError(error, '設定の取得に失敗しました')
    }
  }
})

/**
 * 話者一覧を取得する
 *
 * Irodori-TTS の話者はサーバー再起動時にしか増えないため長めにキャッシュする。
 */
export const speakersQueryOptions = queryOptions({
  queryKey: botSettingsKeys.speakers,
  queryFn: async () => {
    try {
      return await backendApi.listSpeakers()
    } catch (error) {
      throw toApiError(error, '話者一覧の取得に失敗しました')
    }
  },
  staleTime: 10 * 60 * 1000
})

export const useSuspenseMySettings = () => {
  const query = useSuspenseQuery(mySettingsQueryOptions)
  return { ...query, settings: query.data }
}

export const useSuspenseSpeakers = () => {
  const query = useSuspenseQuery(speakersQueryOptions)
  return { ...query, speakers: query.data }
}

/**
 * 自分のBot設定を更新するミューテーション群
 */
export const useBotSettingsMutations = () => {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: botSettingsKeys.settings })

  const setCurrentSpeakerMutation = useMutation({
    mutationFn: async (currentId: string) => {
      try {
        return await backendApi.setCurrentSpeaker({ currentId })
      } catch (error) {
        throw toApiError(error, '話者の切り替えに失敗しました')
      }
    },
    onSuccess: invalidate
  })

  const setSpeakerConfigMutation = useMutation({
    mutationFn: async ({ speakerId, config }: { speakerId: string; config: SpeakerConfig }) => {
      try {
        return await backendApi.setSpeakerConfig(config, { params: { speakerId } })
      } catch (error) {
        throw toApiError(error, '話者設定の保存に失敗しました')
      }
    },
    onSuccess: invalidate
  })

  const clearSpeakerConfigMutation = useMutation({
    mutationFn: async (speakerId: string) => {
      try {
        return await backendApi.clearSpeakerConfig(undefined, { params: { speakerId } })
      } catch (error) {
        throw toApiError(error, '話者設定のリセットに失敗しました')
      }
    },
    onSuccess: invalidate
  })

  return {
    setCurrentSpeaker: setCurrentSpeakerMutation.mutateAsync,
    isSwitchingSpeaker: setCurrentSpeakerMutation.isPending,
    setSpeakerConfig: setSpeakerConfigMutation.mutateAsync,
    isSavingConfig: setSpeakerConfigMutation.isPending,
    clearSpeakerConfig: clearSpeakerConfigMutation.mutateAsync,
    isClearingConfig: clearSpeakerConfigMutation.isPending
  }
}
