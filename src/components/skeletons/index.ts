/**
 * Skeleton Components - Loading placeholders with glassmorphism
 * 
 * Base skeleton components and specialized variants for different UI elements
 */

// Base skeleton components
export { 
  Skeleton, 
  SkeletonText, 
  SkeletonButton, 
  SkeletonAvatar, 
  SkeletonCard,
  SkeletonGroup,
  type SkeletonProps 
} from '../ui/skeleton';

// Signal-specific skeletons
export {
  SignalCardSkeleton,
  CompactSignalCardSkeleton,
  DetailedSignalCardSkeleton,
  MinimalSignalCardSkeleton,
  SignalCardSkeletonGrid,
  type SignalCardSkeletonProps
} from './signal-card-skeleton';

// Dashboard-specific skeletons
export {
  DashboardStatSkeleton,
  DashboardStatsSkeletonGrid,
  MarketOverviewSkeleton,
  MarketOverviewSkeletonGrid,
  ActivityFeedSkeleton,
  DashboardSkeleton,
  PageHeaderSkeleton,
  type DashboardStatSkeletonProps
} from './dashboard-skeleton';