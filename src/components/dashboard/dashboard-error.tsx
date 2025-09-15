/**
 * Dashboard Error Component
 * 
 * Specialized error UI for dashboard-related failures with
 * context-aware recovery options
 */

'use client'

import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, WifiOff, ServerCrash, Clock } from 'lucide-react'
import { MagneticButton } from '@/components/ui'
import { useRouter } from 'next/navigation'

interface DashboardErrorProps {
  error: Error | string
  retry?: () => void
  className?: string
}

export function DashboardError({ error, retry, className = '' }: DashboardErrorProps) {
  const router = useRouter()
  const errorMessage = typeof error === 'string' ? error : error.message

  // Determine error type and appropriate icon
  const getErrorDetails = () => {
    const message = errorMessage.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return {
        icon: WifiOff,
        title: 'Connection Problem',
        description: 'Unable to connect to our servers. Please check your internet connection.',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30'
      }
    }
    
    if (message.includes('timeout')) {
      return {
        icon: Clock,
        title: 'Request Timeout',
        description: 'The request took too long to complete. The server might be busy.',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30'
      }
    }
    
    if (message.includes('server') || message.includes('500')) {
      return {
        icon: ServerCrash,
        title: 'Server Error',
        description: 'Our servers encountered an error. We\'re working to fix this.',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30'
      }
    }
    
    return {
      icon: AlertCircle,
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred while loading your dashboard.',
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
      borderColor: 'border-violet-500/30'
    }
  }

  const errorDetails = getErrorDetails()
  const Icon = errorDetails.icon

  const handleRefresh = () => {
    if (retry) {
      retry()
    } else {
      router.refresh()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`w-full ${className}`}
    >
      <div className="glass-heavy rounded-xl p-8 backdrop-blur-2xl">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <div className={`absolute inset-0 ${errorDetails.bgColor} rounded-full blur-xl opacity-50`} />
            <div className={`relative ${errorDetails.bgColor} rounded-full p-4 backdrop-blur-xl border ${errorDetails.borderColor}`}>
              <Icon className={`w-8 h-8 ${errorDetails.color}`} />
            </div>
          </div>
        </motion.div>

        {/* Error Content */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <h3 className="text-xl font-semibold text-white mb-2">
            {errorDetails.title}
          </h3>
          <p className="text-gray-300 mb-4">
            {errorDetails.description}
          </p>
          
          {/* Show actual error in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                Technical Details
              </summary>
              <pre className="mt-2 p-3 glass-light rounded text-xs text-gray-300 overflow-x-auto">
                {errorMessage}
              </pre>
            </details>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <MagneticButton
            onClick={handleRefresh}
            variant="primary"
            className="group"
          >
            <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            Try Again
          </MagneticButton>
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * Skeleton loader for dashboard error states
 */
export function DashboardErrorSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <div className="glass-heavy rounded-xl p-8 backdrop-blur-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gray-700 rounded-full" />
        </div>
        <div className="text-center space-y-3">
          <div className="h-6 bg-gray-700 rounded w-48 mx-auto" />
          <div className="h-4 bg-gray-700 rounded w-64 mx-auto" />
          <div className="h-10 bg-gray-700 rounded w-32 mx-auto mt-6" />
        </div>
      </div>
    </div>
  )
}