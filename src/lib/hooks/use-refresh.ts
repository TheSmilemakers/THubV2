/**
 * Pull-to-refresh and data refresh hooks
 * 
 * Provides touch-optimized pull-to-refresh functionality
 * and manual refresh capabilities for mobile and desktop
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useDeviceCapabilities, useGestureConfig } from './use-device-capabilities'
import { logger } from '@/lib/logger'

export interface RefreshState {
  isRefreshing: boolean
  pullDistance: number
  canRefresh: boolean
  isTriggered: boolean
}

export interface RefreshOptions {
  enabled?: boolean
  threshold?: number
  resistance?: number
  onRefresh?: () => Promise<void> | void
  onStart?: () => void
  onEnd?: () => void
  queryKeys?: readonly string[][]
}

/**
 * Hook for pull-to-refresh functionality
 * 
 * @example
 * const { refreshState, refreshProps, refresh } = usePullToRefresh({
 *   onRefresh: async () => {
 *     await refetchSignals()
 *     await refetchMarketData()
 *   },
 *   queryKeys: [signalKeys.all, marketKeys.all]
 * })
 */
export function usePullToRefresh(options: RefreshOptions = {}) {
  const {
    enabled = true,
    threshold = 80,
    resistance = 0.5,
    onRefresh,
    onStart,
    onEnd,
    queryKeys = []
  } = options

  const { touch, screenSize } = useDeviceCapabilities()
  const gestureConfig = useGestureConfig()
  const queryClient = useQueryClient()

  const [refreshState, setRefreshState] = useState<RefreshState>({
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false,
    isTriggered: false
  })

  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isTracking = useRef<boolean>(false)
  const containerRef = useRef<HTMLElement | null>(null)

  /**
   * Manual refresh trigger
   */
  const refresh = useCallback(async () => {
    if (refreshState.isRefreshing) return

    setRefreshState(prev => ({ ...prev, isRefreshing: true }))
    onStart?.()

    try {
      // Invalidate specified query keys
      await Promise.all(
        queryKeys.map(queryKey => 
          queryClient.invalidateQueries({ queryKey })
        )
      )

      // Call custom refresh handler
      await onRefresh?.()

      logger.info('Manual refresh completed')
    } catch (error) {
      logger.error('Refresh failed', error)
    } finally {
      setRefreshState(prev => ({ 
        ...prev, 
        isRefreshing: false,
        pullDistance: 0,
        canRefresh: false,
        isTriggered: false
      }))
      onEnd?.()
    }
  }, [refreshState.isRefreshing, queryKeys, queryClient, onRefresh, onStart, onEnd])

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !touch || refreshState.isRefreshing) return

    const scrollTop = containerRef.current?.scrollTop || window.scrollY
    
    // Only start tracking if at the top of the scroll
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY
      currentY.current = startY.current
      isTracking.current = true
    }
  }, [enabled, touch, refreshState.isRefreshing])

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !touch || !isTracking.current || refreshState.isRefreshing) return

    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current

    if (deltaY > 0) {
      // Prevent default scrolling when pulling down
      e.preventDefault()

      // Apply resistance
      const pullDistance = deltaY * resistance
      const canRefresh = pullDistance >= threshold
      const isTriggered = canRefresh && !refreshState.isTriggered

      setRefreshState(prev => ({
        ...prev,
        pullDistance,
        canRefresh,
        isTriggered: isTriggered || prev.isTriggered
      }))

      // Haptic feedback when threshold is reached
      if (isTriggered && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
    }
  }, [enabled, touch, refreshState.isRefreshing, refreshState.isTriggered, resistance, threshold])

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !touch || !isTracking.current) return

    isTracking.current = false

    if (refreshState.canRefresh && refreshState.isTriggered) {
      await refresh()
    } else {
      // Reset state if not refreshing
      setRefreshState(prev => ({
        ...prev,
        pullDistance: 0,
        canRefresh: false,
        isTriggered: false
      }))
    }

    startY.current = 0
    currentY.current = 0
  }, [enabled, touch, refreshState.canRefresh, refreshState.isTriggered, refresh])

  /**
   * Setup touch event listeners
   */
  useEffect(() => {
    if (!enabled || !touch) return

    const container = containerRef.current || document.body

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, touch, handleTouchStart, handleTouchMove, handleTouchEnd])

  /**
   * Props to spread on the container element
   */
  const refreshProps = {
    ref: containerRef as React.RefObject<HTMLDivElement>,
    style: {
      transform: refreshState.pullDistance > 0 
        ? `translateY(${Math.min(refreshState.pullDistance, threshold * 1.5)}px)` 
        : undefined,
      transition: isTracking.current ? 'none' : 'transform 0.3s ease-out'
    }
  }

  return {
    refreshState,
    refreshProps,
    refresh,
    isEnabled: enabled && touch
  }
}

/**
 * Hook for keyboard shortcuts and manual refresh
 * 
 * @example
 * useRefreshShortcuts({
 *   onRefresh: refresh,
 *   enabled: true
 * })
 */
export function useRefreshShortcuts(options: {
  onRefresh: () => Promise<void> | void
  enabled?: boolean
}) {
  const { onRefresh, enabled = true } = options

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + R for refresh
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault()
        onRefresh()
      }

      // F5 for refresh
      if (e.key === 'F5') {
        e.preventDefault()
        onRefresh()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onRefresh, enabled])
}

/**
 * Hook for query invalidation and refresh
 * Provides utilities for refreshing specific data
 * 
 * @example
 * const { refreshSignals, refreshMarketData, refreshAll } = useQueryRefresh()
 */
export function useQueryRefresh() {
  const queryClient = useQueryClient()

  const refreshSignals = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['signals'] })
    logger.info('Refreshed signals data')
  }, [queryClient])

  const refreshMarketData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['market'] })
    logger.info('Refreshed market data')
  }, [queryClient])

  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['signals'] }),
      queryClient.invalidateQueries({ queryKey: ['market'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    ])
    logger.info('Refreshed dashboard data')
  }, [queryClient])

  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries()
    logger.info('Refreshed all cached data')
  }, [queryClient])

  return {
    refreshSignals,
    refreshMarketData,
    refreshDashboard,
    refreshAll
  }
}

// Types are exported inline above