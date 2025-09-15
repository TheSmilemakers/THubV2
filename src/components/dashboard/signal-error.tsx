/**
 * Signal Error Component
 * 
 * Specialized error UI for signal-related failures with
 * specific recovery actions and helpful context
 */

'use client'

import { motion } from 'framer-motion'
import { 
  TrendingDown, 
  RefreshCw, 
  Filter, 
  AlertTriangle,
  WifiOff,
  Search,
  ArrowLeft
} from 'lucide-react'
import { MagneticButton } from '@/components/ui'
import { useRouter } from 'next/navigation'
import type { SignalFilters } from '@/types/signals.types'

interface SignalErrorProps {
  error: Error | string
  filters?: SignalFilters
  onRetry?: () => void
  onClearFilters?: () => void
  onGoBack?: () => void
  className?: string
}

export function SignalError({ 
  error, 
  filters,
  onRetry, 
  onClearFilters,
  onGoBack,
  className = '' 
}: SignalErrorProps) {
  const router = useRouter()
  const errorMessage = typeof error === 'string' ? error : error.message
  const hasFilters = filters && Object.keys(filters).length > 0

  // Determine error type and provide contextual help
  const getErrorContext = () => {
    const message = errorMessage.toLowerCase()
    
    if (message.includes('no signals found') || message.includes('empty')) {
      return {
        icon: Search,
        title: 'No Signals Found',
        description: hasFilters 
          ? 'No signals match your current filters. Try adjusting your criteria.'
          : 'No signals are available at the moment. Check back soon!',
        actions: hasFilters ? ['clearFilters', 'retry'] : ['retry'],
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30'
      }
    }
    
    if (message.includes('offline') || message.includes('network')) {
      return {
        icon: WifiOff,
        title: 'You\'re Offline',
        description: 'Unable to fetch signals. Please check your internet connection.',
        actions: ['retry'],
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30'
      }
    }
    
    if (message.includes('unauthorized') || message.includes('403')) {
      return {
        icon: AlertTriangle,
        title: 'Access Denied',
        description: 'You don\'t have permission to view these signals. Please check your subscription.',
        actions: ['goBack'],
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30'
      }
    }
    
    return {
      icon: TrendingDown,
      title: 'Unable to Load Signals',
      description: 'Something went wrong while fetching signals. Please try again.',
      actions: ['retry', 'goBack'],
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
      borderColor: 'border-violet-500/30'
    }
  }

  const context = getErrorContext()
  const Icon = context.icon

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      router.refresh()
    }
  }

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack()
    } else {
      router.back()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`w-full ${className}`}
    >
      <div className="glass-heavy rounded-xl p-6 sm:p-8 backdrop-blur-2xl">
        {/* Icon with animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            damping: 15,
            delay: 0.1 
          }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5] 
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute inset-0 ${context.bgColor} rounded-full blur-xl`} 
            />
            <div className={`relative ${context.bgColor} rounded-full p-4 backdrop-blur-xl border ${context.borderColor}`}>
              <Icon className={`w-8 h-8 ${context.color}`} />
            </div>
          </div>
        </motion.div>

        {/* Error Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
            {context.title}
          </h3>
          <p className="text-sm sm:text-base text-gray-300">
            {context.description}
          </p>

          {/* Show applied filters if any */}
          {hasFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 glass-light rounded-lg"
            >
              <p className="text-xs text-gray-400 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.entries(filters).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-2 py-1 text-xs bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30"
                  >
                    {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Technical details in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                Debug Info
              </summary>
              <pre className="mt-2 p-2 glass-light rounded text-xs text-gray-300 overflow-x-auto">
                {errorMessage}
              </pre>
            </details>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          {context.actions.includes('retry') && (
            <MagneticButton
              onClick={handleRetry}
              variant="primary"
              size="sm"
              className="group"
            >
              <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </MagneticButton>
          )}

          {context.actions.includes('clearFilters') && onClearFilters && (
            <MagneticButton
              onClick={onClearFilters}
              variant="secondary"
              size="sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </MagneticButton>
          )}

          {context.actions.includes('goBack') && (
            <MagneticButton
              onClick={handleGoBack}
              variant="secondary"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </MagneticButton>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * Empty state component for when no signals are available
 */
export function SignalEmptyState({ 
  hasFilters = false,
  onClearFilters
}: { 
  hasFilters?: boolean
  onClearFilters?: () => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass-medium rounded-xl p-8 text-center">
        <motion.div
          animate={{ 
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="mb-6"
        >
          <Search className="w-16 h-16 mx-auto text-gray-400" />
        </motion.div>
        
        <h3 className="text-lg font-medium text-white mb-2">
          No Signals Found
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          {hasFilters 
            ? 'Try adjusting your filters to see more signals.'
            : 'No trading signals are available right now. Check back soon!'
          }
        </p>

        {hasFilters && onClearFilters && (
          <MagneticButton
            onClick={onClearFilters}
            variant="secondary"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear All Filters
          </MagneticButton>
        )}
      </div>
    </motion.div>
  )
}