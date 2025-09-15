'use client'

/**
 * Chart Error Boundary - Specialized error boundary for chart components
 * 
 * Provides chart-specific error handling with graceful fallbacks
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, AlertCircle, RefreshCw } from 'lucide-react'
import { MagneticButton } from '@/components/ui'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  chartName?: string
  onRetry?: () => void
  showRetry?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Chart Error Boundary caught error', {
      chartName: this.props.chartName,
      error: error.toString(),
      componentStack: errorInfo.componentStack
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      const { chartName = 'Chart', showRetry = true } = this.props

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-8 min-h-[200px] glass-light rounded-lg backdrop-blur-xl border border-white/10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-lg" />
              <div className="relative bg-red-500/10 rounded-full p-3 backdrop-blur-xl border border-red-500/20">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-4"
          >
            <h3 className="text-white font-medium mb-1">
              {chartName} Unavailable
            </h3>
            <p className="text-gray-400 text-sm">
              Unable to load chart data at this time
            </p>
          </motion.div>

          {showRetry && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <MagneticButton
                onClick={this.handleRetry}
                variant="secondary"
                size="sm"
                className="group"
              >
                <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                Retry
              </MagneticButton>
            </motion.div>
          )}
        </motion.div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap charts with error boundary
 */
export function withChartErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  chartName?: string
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ChartErrorBoundary chartName={chartName}>
      <WrappedComponent {...props} />
    </ChartErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withChartErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name
  })`

  return ComponentWithErrorBoundary
}