'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Activity, 
  ChartBar, 
  Settings,
  Menu,
  X,
  Bell,
  User,
  TrendingUp,
  Zap
} from 'lucide-react'
import { useDeviceCapabilities, useAdaptiveGlass, useFrameRateTarget } from '@/lib/hooks/use-device-capabilities'
import { ErrorBoundary } from '@/components/error-boundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  
  // Performance optimization hooks
  const capabilities = useDeviceCapabilities()
  const adaptiveGlass = useAdaptiveGlass()
  const frameRateTarget = useFrameRateTarget()
  
  // Debounced resize handler for better performance
  const [windowWidth, setWindowWidth] = useState(1024)
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced resize handler for better performance
  const debouncedResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }
    
    resizeTimeoutRef.current = setTimeout(() => {
      const newWidth = window.innerWidth
      setWindowWidth(newWidth)
      setIsMobile(newWidth < 768)
      
      // Close sidebar on desktop
      if (newWidth >= 768) {
        setIsSidebarOpen(true)
      }
    }, 150) // 150ms debounce
  }, [])
  
  // Check if mobile on mount and setup debounced resize
  useEffect(() => {
    const initialCheck = () => {
      const width = window.innerWidth
      setWindowWidth(width)
      setIsMobile(width < 768)
      if (width >= 768) {
        setIsSidebarOpen(true)
      }
    }
    
    initialCheck()
    window.addEventListener('resize', debouncedResize)
    
    return () => {
      window.removeEventListener('resize', debouncedResize)
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [debouncedResize])

  // Focus trap for mobile sidebar
  useEffect(() => {
    if (isMobile && isSidebarOpen && sidebarRef.current) {
      const focusableElements = sidebarRef.current.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
        if (e.key === 'Escape') {
          setIsSidebarOpen(false)
          menuButtonRef.current?.focus()
        }
      }

      document.addEventListener('keydown', handleTab)
      firstElement?.focus()

      return () => document.removeEventListener('keydown', handleTab)
    }
  }, [isMobile, isSidebarOpen])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Signals', href: '/signals', icon: Activity },
    { name: 'Analytics', href: '/analytics', icon: ChartBar },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const mobileNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Signals', href: '/signals', icon: Zap },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(10,11,20)] to-black">
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 glass-medium text-white rounded-lg"
      >
        Skip to main content
      </a>
      {/* Desktop Sidebar */}
      <AnimatePresence>
        {(!isMobile || isSidebarOpen) && (
          <motion.aside
            ref={sidebarRef}
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ 
              type: "spring", 
              damping: adaptiveGlass.animations === 'full' ? 25 : 40, 
              stiffness: adaptiveGlass.animations === 'full' ? 200 : 100,
              duration: adaptiveGlass.animations === 'none' ? 0 : undefined
            }}
            className={`
              fixed top-0 left-0 z-40 h-full
              ${adaptiveGlass.blur} bg-black/20 border-r border-white/10
              ${adaptiveGlass.effects ? 'shadow-2xl shadow-violet-500/10' : 'shadow-lg'}
              ${isMobile ? 'w-full' : 'w-64'}
            `}
            style={{
              backdropFilter: capabilities.supportsBackdropFilter ? `blur(${adaptiveGlass.blur.includes('xl') ? '24px' : adaptiveGlass.blur.includes('lg') ? '16px' : '8px'})` : 'none',
              backgroundColor: capabilities.supportsBackdropFilter ? undefined : 'rgba(0, 0, 0, 0.85)'
            }}
            role="navigation"
            aria-label="Main navigation"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg blur-md opacity-75" />
                  <div className="relative bg-black rounded-lg p-2">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
                <span className="text-xl font-bold text-white">THub V2</span>
              </div>
              {isMobile && (
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-300
                      ${isActive 
                        ? 'glass-medium text-white shadow-lg shadow-violet-500/20' 
                        : 'text-gray-300 hover:text-white hover:glass-light'
                      }
                      focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-black
                    `}
                    onClick={() => isMobile && setIsSidebarOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 w-1 h-8 bg-gradient-to-b from-violet-500 to-blue-500 rounded-r-full"
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Premium Badge */}
            <div className="absolute bottom-6 left-4 right-4">
              <div className="glass-medium rounded-xl p-4 border border-violet-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Free Tier</span>
                  <button 
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    aria-label="Upgrade to premium tier"
                  >
                    Upgrade
                  </button>
                </div>
                <div className="text-xs text-gray-300">
                  5 / 10 signals today
                </div>
                <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-gradient-to-r from-violet-500 to-blue-500" />
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${!isMobile && isSidebarOpen ? 'ml-64' : ''}`}>
        {/* Top Header */}
        <header 
          className={`sticky top-0 z-30 ${adaptiveGlass.blur} bg-black/20 border-b border-white/10`}
          style={{
            backdropFilter: capabilities.supportsBackdropFilter ? `blur(${adaptiveGlass.blur.includes('xl') ? '20px' : adaptiveGlass.blur.includes('lg') ? '12px' : '6px'})` : 'none',
            backgroundColor: capabilities.supportsBackdropFilter ? undefined : 'rgba(0, 0, 0, 0.9)'
          }}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              {isMobile && (
                <button
                  ref={menuButtonRef}
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg"
                  aria-label="Open navigation menu"
                  aria-expanded={isSidebarOpen}
                >
                  <Menu className="w-6 h-6" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-white">
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button 
                className="relative p-2 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg"
                aria-label="View notifications"
                aria-describedby="notification-badge"
              >
                <Bell className="w-5 h-5" />
                <span 
                  id="notification-badge"
                  className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full" 
                  aria-label="New notifications available"
                />
              </button>

              {/* User Profile */}
              <button 
                className="flex items-center gap-2 px-3 py-2 glass-light rounded-lg hover:glass-medium transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-black"
                aria-label="User profile menu"
              >
                <div 
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-blue-500" 
                  aria-hidden="true"
                />
                <span className="text-sm text-white hidden sm:block">John Doe</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="p-4 md:p-6 lg:p-8" tabIndex={-1}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div 
          className={`fixed bottom-0 left-0 right-0 z-40 ${adaptiveGlass.blur} bg-black/20 border-t border-white/10 safe-area-bottom`}
          style={{
            backdropFilter: capabilities.supportsBackdropFilter ? `blur(${adaptiveGlass.blur.includes('xl') ? '24px' : adaptiveGlass.blur.includes('lg') ? '16px' : '8px'})` : 'none',
            backgroundColor: capabilities.supportsBackdropFilter ? undefined : 'rgba(0, 0, 0, 0.9)'
          }}
        >
          <nav className="flex justify-around items-center py-2">
            {mobileNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex flex-col items-center gap-1 p-2 rounded-lg
                    transition-all duration-300 min-w-[64px]
                    ${isActive 
                      ? 'text-violet-400' 
                      : 'text-gray-300 hover:text-white'
                    }
                    focus:outline-none focus:ring-2 focus:ring-violet-500
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs">{item.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="mobileActiveIndicator"
                      className="absolute -bottom-1 w-12 h-0.5 bg-gradient-to-r from-violet-500 to-blue-500"
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Backdrop for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
        />
      )}
    </div>
  )
}