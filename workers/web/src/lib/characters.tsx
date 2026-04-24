import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import type { Character, CharacterInput } from '@/schemas/character.dto'
import { backendApi, toApiError } from './backend-api'

export type { Character } from '@/schemas/character.dto'

/**
 * characters 一覧の query key を定義する。
 */
const characterKeys = {
  all: ['characters'] as const
}

/**
 * characters 一覧取得の query options を定義する。
 */
const charactersQueryOptions = queryOptions({
  queryKey: characterKeys.all,
  queryFn: async () => {
    try {
      return await backendApi.listCharacters()
    } catch (error) {
      throw toApiError(error, 'Failed to load characters')
    }
  }
})

/**
 * characters 一覧を Suspense で取得する。
 */
export const useSuspenseCharacters = () => {
  const query = useSuspenseQuery(charactersQueryOptions)

  return {
    ...query,
    characters: query.data,
    getCharacter: (id: string) => query.data.find((character) => character.id === id)
  }
}

/**
 * characters 更新系 mutation をまとめて提供する。
 */
export const useCharacterMutations = () => {
  const queryClient = useQueryClient()
  const addCharacterMutation = useMutation({
    mutationFn: async (input: CharacterInput) => {
      try {
        return await backendApi.createCharacter(input)
      } catch (error) {
        throw toApiError(error, 'Failed to create character')
      }
    },
    onSuccess: (character) => {
      queryClient.setQueryData<readonly Character[]>(characterKeys.all, (prev = []) => [character, ...prev])
    }
  })
  const updateCharacterMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CharacterInput }) => {
      try {
        return await backendApi.updateCharacter(input, {
          params: {
            id
          }
        })
      } catch (error) {
        throw toApiError(error, 'Failed to update character')
      }
    },
    onSuccess: (character, variables) => {
      queryClient.setQueryData<readonly Character[]>(characterKeys.all, (prev = []) =>
        prev.map((item) => (item.id === variables.id ? character : item))
      )
    }
  })
  const deleteCharacterMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await backendApi.deleteCharacter(undefined, {
          params: {
            id
          }
        })
      } catch (error) {
        throw toApiError(error, 'Failed to delete character')
      }
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<readonly Character[]>(characterKeys.all, (prev = []) =>
        prev.filter((character) => character.id !== id)
      )
    }
  })

  return {
    addCharacter: addCharacterMutation.mutateAsync,
    updateCharacter: (id: string, input: CharacterInput) => updateCharacterMutation.mutateAsync({ id, input }),
    deleteCharacter: deleteCharacterMutation.mutateAsync
  }
}
