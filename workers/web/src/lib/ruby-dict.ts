import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import type { RubyDict, RubyDictEntryInput, RubyDictInput } from '@/schemas/ruby-dict.dto'
import { backendApi, toApiError } from './backend-api'

const rubyDictKeys = {
  all: ['ruby-dict'] as const,
  scenario: (id: string) => ['ruby-dict', 'scenario', id] as const
}

export const rubyDictsQueryOptions = queryOptions({
  queryKey: rubyDictKeys.all,
  queryFn: async () => {
    try {
      return await backendApi.listRubyDicts()
    } catch (error) {
      throw toApiError(error, 'Failed to load ruby dictionaries')
    }
  }
})

export const scenarioRubyDictsQueryOptions = (scenarioId: string) =>
  queryOptions({
    queryKey: rubyDictKeys.scenario(scenarioId),
    queryFn: async () => {
      try {
        return await backendApi.listScenarioRubyDicts({ params: { scenarioId } })
      } catch (error) {
        throw toApiError(error, 'Failed to load scenario ruby dictionaries')
      }
    }
  })

export const useSuspenseRubyDicts = () => {
  const query = useSuspenseQuery(rubyDictsQueryOptions)
  return { ...query, dicts: query.data }
}

export const useSuspenseRubyDict = (dictId: string) => {
  const query = useSuspenseQuery({
    ...rubyDictsQueryOptions,
    select: (dicts) => dicts.find((d) => d.id === dictId)
  })
  return query.data
}

export const useSuspenseScenarioRubyDicts = (scenarioId: string) => {
  const query = useSuspenseQuery(scenarioRubyDictsQueryOptions(scenarioId))
  return { ...query, dicts: query.data }
}

export const useRubyDictMutations = () => {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: rubyDictKeys.all })

  const addDictMutation = useMutation({
    mutationFn: async (input: RubyDictInput) => {
      try {
        return await backendApi.createRubyDict(input)
      } catch (error) {
        throw toApiError(error, 'Failed to create dictionary')
      }
    },
    onSuccess: invalidate
  })

  const updateDictMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RubyDictInput }) => {
      try {
        return await backendApi.updateRubyDict(input, { params: { id } })
      } catch (error) {
        throw toApiError(error, 'Failed to update dictionary')
      }
    },
    onSuccess: invalidate
  })

  const deleteDictMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await backendApi.deleteRubyDict(undefined, { params: { id } })
      } catch (error) {
        throw toApiError(error, 'Failed to delete dictionary')
      }
    },
    onSuccess: invalidate
  })

  return {
    addDict: addDictMutation.mutateAsync,
    updateDict: (id: string, input: RubyDictInput) => updateDictMutation.mutateAsync({ id, input }),
    deleteDict: deleteDictMutation.mutateAsync
  }
}

export const useRubyDictEntryMutations = () => {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: rubyDictKeys.all })

  const addEntryMutation = useMutation({
    mutationFn: async ({ dictId, input }: { dictId: string; input: RubyDictEntryInput }) => {
      try {
        return await backendApi.createRubyDictEntry(input, { params: { dictId } })
      } catch (error) {
        throw toApiError(error, 'Failed to create entry')
      }
    },
    onSuccess: invalidate
  })

  const updateEntryMutation = useMutation({
    mutationFn: async ({ dictId, entryId, input }: { dictId: string; entryId: string; input: RubyDictEntryInput }) => {
      try {
        return await backendApi.updateRubyDictEntry(input, { params: { dictId, entryId } })
      } catch (error) {
        throw toApiError(error, 'Failed to update entry')
      }
    },
    onSuccess: invalidate
  })

  const deleteEntryMutation = useMutation({
    mutationFn: async ({ dictId, entryId }: { dictId: string; entryId: string }) => {
      try {
        await backendApi.deleteRubyDictEntry(undefined, { params: { dictId, entryId } })
      } catch (error) {
        throw toApiError(error, 'Failed to delete entry')
      }
    },
    onSuccess: invalidate
  })

  return {
    addEntry: (dictId: string, input: RubyDictEntryInput) => addEntryMutation.mutateAsync({ dictId, input }),
    updateEntry: (dictId: string, entryId: string, input: RubyDictEntryInput) =>
      updateEntryMutation.mutateAsync({ dictId, entryId, input }),
    deleteEntry: (dictId: string, entryId: string) => deleteEntryMutation.mutateAsync({ dictId, entryId })
  }
}

export const useScenarioRubyDictMutations = (scenarioId: string) => {
  const queryClient = useQueryClient()
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: rubyDictKeys.scenario(scenarioId) })
  }

  const associateMutation = useMutation({
    mutationFn: async (dictId: string) => {
      try {
        return await backendApi.associateRubyDict(undefined, { params: { scenarioId, dictId } })
      } catch (error) {
        throw toApiError(error, 'Failed to associate dictionary')
      }
    },
    onSuccess: invalidate
  })

  const dissociateMutation = useMutation({
    mutationFn: async (dictId: string) => {
      try {
        await backendApi.dissociateRubyDict(undefined, { params: { scenarioId, dictId } })
      } catch (error) {
        throw toApiError(error, 'Failed to dissociate dictionary')
      }
    },
    onSuccess: invalidate
  })

  return {
    associate: associateMutation.mutateAsync,
    dissociate: dissociateMutation.mutateAsync
  }
}

export type { RubyDict }
