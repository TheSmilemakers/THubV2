/**
 * Global Error Boundary Component
 * 
 * Catches React component errors and displays a beautiful glassmorphic
 * error UI with recovery options
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { MagneticButton } from '@/components/ui'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    logger.error('ErrorBoundary caught error', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId
    })

    this.setState({ errorInfo })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      const { error, errorInfo, errorId } = this.state
      const { showDetails = process.env.NODE_ENV === 'development' } = this.props

      return (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[rgb(10,11,20)] to-black"
          >
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
            </div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative max-w-2xl w-full"
            >
              <div className="glass-heavy rounded-2xl p-8 md:p-12 backdrop-blur-2xl">
                {/* Error Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="flex justify-center mb-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-50" />
                    <div className="relative bg-red-500/20 rounded-full p-6 backdrop-blur-xl border border-red-500/30">
                      <AlertTriangle className="w-12 h-12 text-red-400" />
                    </div>
                  </div>
                </motion.div>

                {/* Error Message */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-8"
                >
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    Oops! Something went wrong
                  </h1>
                  <p className="text-gray-300 text-lg mb-2">
                    We encountered an unexpected error while loading this page.
                  </p>
                  <p className="text-gray-400 text-sm">
                    Error ID: <code className="text-red-400">{errorId}</code>
                  </p>
                </motion.div>

                {/* Error Details (Development Only) */}
                {showDetails && error && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                  >
                    <div className="glass-light rounded-lg p-4 backdrop-blur-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Bug className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-medium text-red-400">Debug Information</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Error Message:</p>
                          <p className="text-sm text-gray-200 font-mono break-all">
                            {error.toString()}
                          </p>
                        </div>
                        {errorInfo && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Component Stack:</p>
                            <pre className="text-xs text-gray-300 font-mono overflow-x-auto max-h-32 overflow-y-auto">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <MagneticButton
                    onClick={this.handleReset}
                    variant="primary"
                    className="group"
                  >
                    <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                    Try Again
                  </MagneticButton>

                  <MagneticButton
                    onClick={this.handleGoHome}
                    variant="secondary"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </MagneticButton>
                </motion.div>

                {/* Help Text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center text-sm text-gray-400 mt-8"
                >
                  If this problem persists, please contact support with the error ID above.
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to trigger error boundary (for testing)
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error
  }
}