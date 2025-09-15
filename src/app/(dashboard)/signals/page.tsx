'use client'

import { useState, useMemo, Suspense } from 'react'
import { GlassCard } from '@/components/ui'
import { SignalCard } from '@/components/signals'
import { SignalCardSkeletonGrid, PageHeaderSkeleton } from '@/components/skeletons'
import { SignalSuspense } from '@/components/ui/suspense-wrapper'
import { 
  Filter, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSignals, useSignalSubscriptions, usePullToRefresh, useQueryRefresh } from '@/lib/hooks'
import { MagneticButton } from '@/components/ui'
import type { SignalQueryOptions, UISignalStrength } from '@/types/signals.types'

const filterOptions = {
  signal: ['all', 'strong_buy', 'buy', 'hold', 'sell', 'strong_sell'],
  score: ['all', '90+', '80-90', '70-80', '60-70', '<60'],
  timeframe: ['all', '5min', '15min', '30min', '1h', '4h', '1d'],
}

const sortOptions = [
  { value: 'score', label: 'Score', icon: Sparkles },
  { value: 'time', label: 'Latest', icon: Activity },
  { value: 'price_change', label: 'Price Change', icon: TrendingUp },
  { value: 'volume', label: 'Volume', icon: ArrowUpDown },
]

export default function SignalsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSignal, setFilterSignal] = useState('all')
  const [filterScore, setFilterScore] = useState('all')
  const [filterTimeframe, setFilterTimeframe] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [showFilters, setShowFilters] = useState(false)

  // Build query options from filters
  const queryOptions = useMemo((): SignalQueryOptions => {
    const filters: any = {}
    
    // Convert UI signal strength to database values
    if (filterSignal !== 'all') {
      filters.signal_strength = [filterSignal as UISignalStrength]
    }
    
    // Convert score filter to min/max values
    if (filterScore !== 'all') {
      switch (filterScore) {
        case '90+':
          filters.min_score = 90
          break
        case '80-90':
          filters.min_score = 80
          filters.max_score = 89
          break
        case '70-80':
          filters.min_score = 70
          filters.max_score = 79
          break
        case '60-70':
          filters.min_score = 60
          filters.max_score = 69
          break
        case '<60':
          filters.max_score = 59
          break
      }
    }

    // Add search query
    if (searchQuery.trim()) {
      filters.symbol = searchQuery.trim()
    }

    return {
      filters,
      sort: {
        by: sortBy as any,
        order: 'desc'
      },
      limit: 50 // Load more signals for signals page
    }
  }, [searchQuery, filterSignal, filterScore, sortBy])

  // Fetch signals with query options
  const { data: signalsData, isLoading, error, refetch } = useSignals(queryOptions)
  
  // Enable real-time subscriptions
  const { isConnected } = useSignalSubscriptions({
    market: 'stocks_us',
    enabled: true
  })

  // Setup refresh functionality
  const { refreshSignals } = useQueryRefresh()
  const { refreshState, refreshProps, refresh } = usePullToRefresh({
    onRefresh: refreshSignals,
    threshold: 80,
    resistance: 0.5
  })

  const signals = signalsData?.data || []
  const totalSignals = signalsData?.count || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-white">Trading Signals</h2>
        <p className="text-gray-400 mt-1">Real-time AI-powered trading signals with 3-layer convergence analysis</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by symbol or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 glass-light rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 glass-light rounded-xl flex items-center gap-2 transition-all ${
              showFilters ? 'glass-medium text-violet-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
            {(filterSignal !== 'all' || filterScore !== 'all') && (
              <span className="w-2 h-2 bg-violet-500 rounded-full" />
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <button className="px-4 py-3 glass-light rounded-xl flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Sort by {sortOptions.find(o => o.value === sortBy)?.label}</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <GlassCard variant="surface" className="p-6 space-y-4">
                {/* Signal Strength Filter */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Signal Strength</label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.signal.map(option => (
                      <button
                        key={option}
                        onClick={() => setFilterSignal(option)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          filterSignal === option
                            ? 'glass-medium text-white'
                            : 'glass-light text-gray-400 hover:text-white'
                        }`}
                      >
                        {option === 'all' ? 'All' : option.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score Filter */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Convergence Score</label>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.score.map(option => (
                      <button
                        key={option}
                        onClick={() => setFilterScore(option)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          filterScore === option
                            ? 'glass-medium text-white'
                            : 'glass-light text-gray-400 hover:text-white'
                        }`}
                      >
                        {option === 'all' ? 'All' : option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Sort By</label>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                          sortBy === option.value
                            ? 'glass-medium text-white'
                            : 'glass-light text-gray-400 hover:text-white'
                        }`}
                      >
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          Found <span className="text-white font-medium">{totalSignals}</span> signals
          {isLoading && <span className="ml-2 text-sm">Loading...</span>}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{isConnected ? 'Live updates' : 'Disconnected'}</span>
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

      {/* Signals Grid with Suspense */}
      <div {...refreshProps}>
        <SignalSuspense fallback={<SignalCardSkeletonGrid count={signals.length || 6} />}>
          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <GlassCard variant="surface" className="p-12">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Failed to load signals</h3>
                <p className="text-gray-400 mb-4">{error.message}</p>
                <MagneticButton onClick={() => refetch()} variant="primary">
                  Try Again
                </MagneticButton>
              </GlassCard>
            </motion.div>
          ) : signals.length === 0 && !isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <GlassCard variant="surface" className="p-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No signals found</h3>
                <p className="text-gray-400">Try adjusting your filters or search criteria</p>
              </GlassCard>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {signals.map((signal, index) => (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <SignalCard signal={signal} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </SignalSuspense>
      </div>
    </div>
  )
}