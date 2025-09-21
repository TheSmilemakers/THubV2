/**
 * React Query hooks for signal data operations
 * 
 * Provides type-safe hooks for fetching and mutating signal data
 * with automatic caching, optimistic updates, and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { signalsAPI } from '@/lib/api/signals.api'
import { signalsService } from '@/lib/services/signals.service'
import type { 
  Signal, 
  SignalQueryOptions, 
  SignalResponse,
  SignalAnalytics 
} from '@/types/signals.types'
import { useAuth } from '@/lib/auth/client-auth'
import { logger } from '@/lib/logger'

// Query key factories for consistent cache key generation
export const signalKeys = {
  all: ['signals'] as const,
  lists: () => [...signalKeys.all, 'list'] as const,
  list: (options: SignalQueryOptions) => [...signalKeys.lists(), options] as const,
  details: () => [...signalKeys.all, 'detail'] as const,
  detail: (id: string) => [...signalKeys.details(), id] as const,
  analytics: () => [...signalKeys.all, 'analytics'] as const,
}

/**
 * Hook to fetch signals with filters and pagination
 * 
 * @example
 * const { data, isLoading, error } = useSignals({
 *   filters: { market: 'stocks_us', min_score: 70 },
 *   sort: { by: 'score', order: 'desc' },
 *   limit: 20
 * })
 */
export function useSignals(options: SignalQueryOptions = {}) {
  return useQuery<SignalResponse, Error>({
    queryKey: signalKeys.list(options),
    queryFn: async () => {
      try {
        const response = await signalsAPI.getSignals(options)
        logger.info('Fetched signals', { count: response.count })
        return response
      } catch (error) {
        logger.error('Failed to fetch signals', error)
        throw new Error('Unable to load signals. Please try again.')
      }
    },
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute when window is focused
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.message.includes('4')) return false
      return failureCount < 3
    },
  })
}

/**
 * Hook to fetch a single signal by ID
 * 
 * @example
 * const { data: signal, isLoading } = useSignal('signal-id-123')
 */
export function useSignal(id: string | undefined) {
  const { user } = useAuth()
  
  return useQuery<Signal | null, Error>({
    queryKey: signalKeys.detail(id!),
    queryFn: async () => {
      if (!id) return null
      
      try {
        const signal = await signalsAPI.getSignalById(id)
        
        // Auto-mark as viewed when fetching detail
        if (signal && user) {
          signalsAPI.markAsViewed(id).catch(logger.error)
        }
        
        return signal
      } catch (error) {
        logger.error('Failed to fetch signal', { id, error })
        throw new Error('Unable to load signal details.')
      }
    },
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook to fetch signal analytics
 * 
 * @example
 * const { data: analytics } = useSignalAnalytics()
 */
export function useSignalAnalytics() {
  return useQuery<SignalAnalytics, Error>({
    queryKey: signalKeys.analytics(),
    queryFn: async () => {
      try {
        return await signalsAPI.getAnalytics()
      } catch (error) {
        logger.error('Failed to fetch analytics', error)
        throw new Error('Unable to load analytics data.')
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

/**
 * Hook to save/unsave a signal
 * 
 * @example
 * const { mutate: toggleSave, isPending } = useSaveSignal()
 * toggleSave({ signalId: 'signal-123' })
 */
export function useSaveSignal() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<boolean, Error, { signalId: string }, { previousLists: any[], previousDetail: any }>({
    mutationFn: async ({ signalId }) => {
      if (!user) throw new Error('You must be logged in to save signals')
      
      try {
        return await signalsAPI.toggleSaved(signalId)
      } catch (error) {
        logger.error('Failed to toggle saved signal', { signalId, error })
        throw new Error('Unable to save signal. Please try again.')
      }
    },
    onMutate: async ({ signalId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: signalKeys.all })

      // Snapshot previous values
      const previousLists = queryClient.getQueriesData({ 
        queryKey: signalKeys.lists() 
      })
      const previousDetail = queryClient.getQueryData(
        signalKeys.detail(signalId)
      )

      // Optimistically update the signal
      queryClient.setQueriesData(
        { queryKey: signalKeys.lists() },
        (old: SignalResponse | undefined) => {
          if (!old || !user) return old
          
          return {
            ...old,
            data: old.data.map(signal => 
              signal.id === signalId
                ? {
                    ...signal,
                    saved_by: signal.saved_by?.includes(user.id)
                      ? signal.saved_by.filter((id: string) => id !== user.id)
                      : [...(signal.saved_by || []), user.id]
                  }
                : signal
            )
          }
        }
      )

      // Update detail view
      queryClient.setQueryData(
        signalKeys.detail(signalId),
        (old: Signal | null | undefined) => {
          if (!old || !user) return old
          
          return {
            ...old,
            saved_by: old.saved_by?.includes(user.id)
              ? old.saved_by.filter((id: string) => id !== user.id)
              : [...(old.saved_by || []), user.id]
          }
        }
      )

      return { previousLists, previousDetail } as const
    },
    onError: (err, { signalId }, context) => {
      // Rollback on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          signalKeys.detail(signalId),
          context.previousDetail
        )
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: signalKeys.lists() })
    },
  })
}

/**
 * Hook to mark a signal as viewed
 * 
 * @example
 * const { mutate: markAsViewed } = useMarkAsViewed()
 * markAsViewed({ signalId: 'signal-123' })
 */
export function useMarkAsViewed() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<void, Error, { signalId: string }>({
    mutationFn: async ({ signalId }) => {
      if (!user) return // Silently skip if not logged in
      
      try {
        await signalsService.markAsViewed(signalId, user.id)
      } catch (error) {
        // Non-critical error, just log it
        logger.error('Failed to mark signal as viewed', { signalId, error })
      }
    },
    onSuccess: (_, { signalId }) => {
      // Update the cache to reflect the view
      queryClient.setQueriesData(
        { queryKey: signalKeys.lists() },
        (old: SignalResponse | undefined) => {
          if (!old || !user) return old
          
          return {
            ...old,
            data: old.data.map(signal => 
              signal.id === signalId && !signal.viewed_by?.includes(user.id)
                ? {
                    ...signal,
                    viewed_by: [...(signal.viewed_by || []), user.id]
                  }
                : signal
            )
          }
        }
      )
    },
  })
}

// Re-export for convenience
export type { Signal, SignalQueryOptions, SignalResponse, SignalAnalytics }