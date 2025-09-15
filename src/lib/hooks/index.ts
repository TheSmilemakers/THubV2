export { 
  useDeviceCapabilities, 
  useAdaptiveGlass, 
  usePerformanceTier, 
  useGestureConfig, 
  useFrameRateTarget,
  useMobileGlassOptimization
} from './use-device-capabilities';

export type { 
  DeviceCapabilities, 
  AdaptiveGlassConfig 
} from './use-device-capabilities';

// Signal hooks
export {
  useSignals,
  useSignal,
  useSignalAnalytics,
  useSaveSignal,
  useMarkAsViewed,
  signalKeys
} from './use-signals';

export type {
  Signal,
  SignalQueryOptions,
  SignalResponse,
  SignalAnalytics
} from './use-signals';

// Signal subscription hooks
export {
  useSignalSubscriptions,
  useSignalSubscriptionStatus
} from './use-signal-subscriptions';

export type {
  SubscriptionOptions,
  SubscriptionState,
  SignalEvent
} from './use-signal-subscriptions';

// Market data hooks
export {
  useRealTimeQuote,
  useIntradayData,
  useMarketIndices,
  useDashboardStats,
  useMultipleQuotes,
  marketKeys
} from './use-market-data';

export type {
  RealTimeQuote,
  IntradayData
} from './use-market-data';

// Refresh and pull-to-refresh hooks
export {
  usePullToRefresh,
  useRefreshShortcuts,
  useQueryRefresh
} from './use-refresh';