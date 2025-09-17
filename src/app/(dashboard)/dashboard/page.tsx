'use client'

import { Suspense } from 'react'
import { GlassCard } from '@/components/ui'
import { SignalCard, SignalSparkline } from '@/components/signals'
import { 
  DashboardSkeleton,
  DashboardStatsSkeletonGrid,
  SignalCardSkeletonGrid,
  MarketOverviewSkeletonGrid,
  ActivityFeedSkeleton
} from '@/components/skeletons'
import { DashboardSuspense, SignalSuspense, ChartSuspense } from '@/components/ui/suspense-wrapper'
import { TrendingUp, Activity, DollarSign, BarChart3, Zap, Clock, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { 
  useSignals, 
  useSignalSubscriptions, 
  usePullToRefresh,
  useQueryRefresh
} from '@/lib/hooks'
import { useDashboardStats, useMarketIndices } from '@/lib/hooks/use-market-data'
import { MagneticButton } from '@/components/ui'

const statsConfig = [
  {
    key: 'active_signals' as const,
    name: 'Active Signals',
    icon: Zap,
    gradient: 'from-violet-500 to-blue-500'
  },
  {
    key: 'success_rate' as const,
    name: 'Success Rate',
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    key: 'total_profit' as const,
    name: 'Total Profit',
    icon: DollarSign,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    key: 'avg_return' as const,
    name: 'Avg. Return',
    icon: BarChart3,
    gradient: 'from-purple-500 to-pink-500'
  },
]

// Separate components for better loading management
const DashboardStats = () => {
  const { data: stats, isLoading, error } = useDashboardStats()
  
  if (error) throw error
  if (isLoading || !stats) return <DashboardStatsSkeletonGrid />

  const formatValue = (key: string, value: number) => {
    switch (key) {
      case 'success_rate':
      case 'avg_return':
        return `${value}%`
      case 'total_profit':
        return `$${value.toLocaleString()}`
      default:
        return value.toString()
    }
  }

  const getChangeValue = (key: string) => {
    switch (key) {
      case 'active_signals':
        return stats.change_active_signals
      case 'success_rate':
        return stats.change_success_rate
      case 'total_profit':
        return stats.change_total_profit
      case 'avg_return':
        return stats.change_avg_return
      default:
        return '+0%'
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((config, index) => {
        const value = stats[config.key]
        const change = getChangeValue(config.key)
        const isPositive = change.startsWith('+')

        return (
          <motion.div
            key={config.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlassCard variant="elevated" className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{config.name}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatValue(config.key, value)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {change}
                    </span>
                    <span className="text-xs text-gray-500">vs last week</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-r ${config.gradient} bg-opacity-10`}>
                  <config.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </div>
  )
};

const RecentSignals = () => {
  const { data: signalsData, isLoading, error } = useSignals({ 
    sort: { by: 'created_at', order: 'desc' },
    limit: 4 
  })
  
  if (error) throw error
  if (isLoading || !signalsData) return <SignalCardSkeletonGrid count={2} />

  const signals = signalsData.data.slice(0, 2) // Show only 2 most recent for dashboard

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-400" />
          Recent Signals
        </h3>
        <button className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
          View all →
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SignalCard signal={signal} />
          </motion.div>
        ))}
      </div>
    </div>
  )
};

const MarketOverview = () => {
  const { data: indices, isLoading, error } = useMarketIndices()
  
  if (error) throw error
  if (isLoading || !indices) return <MarketOverviewSkeletonGrid />

  return (
    <div>
      <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-violet-400" />
        Market Overview
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {indices.map((index, idx) => {
          const sparklineData = index.data.map(point => ({
            value: point.close,
            timestamp: point.datetime
          }))

          return (
            <GlassCard key={index.symbol} variant="surface" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">{index.name}</span>
                <span className={`text-sm ${index.isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {index.isUp ? '+' : ''}{(typeof index.changePercent === 'number' ? index.changePercent : Number(index.changePercent) || 0).toFixed(2)}%
                </span>
              </div>
              <div className="h-20">
                {sparklineData.length > 0 ? (
                  <SignalSparkline 
                    data={sparklineData}
                    trend={index.isUp ? "up" : "down"}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    No chart data
                  </div>
                )}
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
};

const ActivityFeed = () => (
  <GlassCard variant="surface" className="p-6">
    <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
      <Clock className="w-5 h-5 text-violet-400" />
      Recent Activity
    </h3>
    
    <div className="space-y-3">
      {[
        { time: '2 min ago', text: 'New STRONG BUY signal: AAPL', type: 'signal' },
        { time: '15 min ago', text: 'Portfolio update: +2.3% today', type: 'update' },
        { time: '1 hour ago', text: 'Market scan completed: 11,249 symbols analyzed', type: 'scan' },
        { time: '2 hours ago', text: 'Signal closed: MSFT +5.2% profit', type: 'success' },
      ].map((activity, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              activity.type === 'signal' ? 'bg-violet-500' :
              activity.type === 'success' ? 'bg-green-500' :
              activity.type === 'scan' ? 'bg-blue-500' :
              'bg-gray-500'
            }`} />
            <span className="text-sm text-gray-300">{activity.text}</span>
          </div>
          <span className="text-xs text-gray-500">{activity.time}</span>
        </motion.div>
      ))}
    </div>
  </GlassCard>
);

export default function DashboardPage() {
  // Enable real-time signal subscriptions
  const { isConnected, error: subscriptionError } = useSignalSubscriptions({
    market: 'stocks_us',
    enabled: true
  })

  // Setup refresh functionality
  const { refreshDashboard } = useQueryRefresh()
  const { refreshState, refreshProps, refresh } = usePullToRefresh({
    onRefresh: refreshDashboard,
    threshold: 80,
    resistance: 0.5
  })

  return (
    <div className="space-y-6" {...refreshProps}>
      {/* Page Header with Status */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Welcome back!</h2>
            <p className="text-gray-400 mt-1">Here's what's happening with your signals today.</p>
          </div>
          
          {/* Connection Status & Manual Refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-gray-400">
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
            
            <MagneticButton
              onClick={refresh}
              variant="ghost"
              size="sm"
              disabled={refreshState.isRefreshing}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${refreshState.isRefreshing ? 'animate-spin' : ''}`} />
            </MagneticButton>
          </div>
        </div>

        {/* Pull-to-refresh indicator */}
        {refreshState.pullDistance > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-2"
          >
            <div className={`flex items-center gap-2 text-sm ${
              refreshState.canRefresh ? 'text-violet-400' : 'text-gray-400'
            }`}>
              <RefreshCw className={`w-4 h-4 ${refreshState.isTriggered ? 'animate-spin' : ''}`} />
              <span>
                {refreshState.canRefresh ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats Grid with Suspense */}
      <DashboardSuspense fallback={<DashboardStatsSkeletonGrid />}>
        <DashboardStats />
      </DashboardSuspense>

      {/* Recent Signals Section with Suspense */}
      <SignalSuspense fallback={<SignalCardSkeletonGrid count={2} />}>
        <RecentSignals />
      </SignalSuspense>

      {/* Market Overview with Suspense */}
      <ChartSuspense fallback={<MarketOverviewSkeletonGrid />}>
        <MarketOverview />
      </ChartSuspense>

      {/* Activity Feed with Suspense */}
      <DashboardSuspense fallback={<ActivityFeedSkeleton />}>
        <ActivityFeed />
      </DashboardSuspense>
    </div>
  )
}