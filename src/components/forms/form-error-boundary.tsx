'use client'

/**
 * Form Error Boundary - Specialized error boundary for form components
 * 
 * Provides form-specific error handling with validation feedback
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, FileText } from 'lucide-react'
import { MagneticButton } from '@/components/ui'
import { logger } from '@/lib/logger'

interface Props {
  children: ReactNode
  formName?: string
  onReset?: () => void
  showReset?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

export class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Form Error Boundary caught error', {
      formName: this.props.formName,
      error: error.toString(),
      componentStack: errorInfo.componentStack
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      const { formName = 'Form', showReset = true } = this.props

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-light rounded-lg p-6 backdrop-blur-xl border border-white/10"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-sm" />
                <div className="relative bg-amber-500/10 rounded-full p-2 backdrop-blur-xl border border-amber-500/20">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium mb-1">
                {formName} Error
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                There was an issue with the form. Please try again or refresh the page.
              </p>

              {showReset && (
                <MagneticButton
                  onClick={this.handleReset}
                  variant="secondary"
                  size="sm"
                  className="group"
                >
                  <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                  Reset Form
                </MagneticButton>
              )}
            </div>
          </div>
        </motion.div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap forms with error boundary
 */
export function withFormErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  formName?: string
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <FormErrorBoundary formName={formName}>
      <WrappedComponent {...props} />
    </FormErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withFormErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name
  })`

  return ComponentWithErrorBoundary
}