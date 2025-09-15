/**
 * Navigation/Navbar Component with Progressive Enhancement
 * 
 * Features:
 * - Responsive design with mobile drawer
 * - Progressive glass effects based on device capability
 * - Touch-optimized navigation items
 * - Sticky/fixed positioning with scroll effects
 * - Breadcrumb integration
 * - Search integration
 * - User menu with avatar
 * - Mobile-first hamburger menu
 * - WCAG 2.1 AA accessibility
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Home,
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavItem[];
}

export interface NavbarProps {
  logo?: React.ReactNode;
  logoText?: string;
  logoHref?: string;
  items?: NavItem[];
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  userAvatar?: string;
  userName?: string;
  variant?: 'fixed' | 'sticky' | 'static';
  transparent?: boolean;
  className?: string;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onUserMenuClick?: (action: string) => void;
}

export function Navbar({
  logo,
  logoText = "THub",
  logoHref = "/",
  items = [],
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
  userAvatar,
  userName = "User",
  variant = 'sticky',
  transparent = false,
  className,
  onSearch,
  onNotificationClick,
  onUserMenuClick,
}: NavbarProps) {
  const pathname = usePathname();
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Scroll detection for dynamic styling
  useEffect(() => {
    if (variant !== 'fixed' && variant !== 'sticky') return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-navbar]')) {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
      
      // Quick search shortcut
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
    }
  };

  const handleUserMenuAction = (action: string) => {
    setIsUserMenuOpen(false);
    onUserMenuClick?.(action);
  };

  const isActiveRoute = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  // Base navbar styling
  const getNavbarClasses = () => {
    const baseClasses = cn(
      "w-full z-40 transition-all duration-300",
      variant === 'fixed' && "fixed top-0",
      variant === 'sticky' && "sticky top-0",
      componentConfig.hardwareAcceleration && "gpu-accelerated"
    );

    const backgroundClasses = cn(
      transparent && !isScrolled && !isMobileMenuOpen
        ? "bg-transparent"
        : componentConfig.glassmorphism 
          ? cn(getGlassClass(), "border-b border-border-primary/20")
          : "bg-background-primary border-b border-border-primary",
      isScrolled && "shadow-lg"
    );

    return cn(baseClasses, backgroundClasses, className);
  };

  return (
    <nav className={getNavbarClasses()} data-navbar>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href={logoHref}
              className="flex items-center gap-2 text-xl font-bold text-text-primary hover:text-accent-primary transition-colors"
            >
              {logo || <Zap className="w-6 h-6 text-accent-primary" />}
              <span>{logoText}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {items.map((item) => (
              <NavItemDesktop 
                key={item.href} 
                item={item} 
                isActive={isActiveRoute(item.href)}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            {showSearch && (
              <div className="hidden sm:block relative">
                <form onSubmit={handleSearch}>
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search... (⌘K)"
                    className={cn(
                      "w-64 pl-10 pr-4 py-2 text-sm rounded-lg transition-all",
                      "bg-background-secondary border border-border-primary",
                      "focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary",
                      "placeholder:text-text-tertiary",
                      "touch-target"
                    )}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                </form>
              </div>
            )}

            {/* Notifications */}
            {showNotifications && (
              <button
                onClick={onNotificationClick}
                className={cn(
                  "relative p-2 text-text-secondary hover:text-text-primary",
                  "hover:bg-background-tertiary rounded-lg transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
                  "touch-target"
                )}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-status-error rounded-full" />
              </button>
            )}

            {/* User Menu */}
            {showUserMenu && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 p-2 text-text-secondary hover:text-text-primary",
                    "hover:bg-background-tertiary rounded-lg transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
                    "touch-target"
                  )}
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                >
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt={userName}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    isUserMenuOpen && "rotate-180"
                  )} />
                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <UserDropdown 
                      userName={userName}
                      onAction={handleUserMenuAction}
                    />
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "md:hidden p-2 text-text-secondary hover:text-text-primary",
                "hover:bg-background-tertiary rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
                "touch-target"
              )}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu 
            items={items}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={handleSearch}
            showSearch={showSearch}
            isActiveRoute={isActiveRoute}
          />
        )}
      </AnimatePresence>
    </nav>
  );
}

// Desktop Navigation Item Component
function NavItemDesktop({ 
  item, 
  isActive 
}: { 
  item: NavItem; 
  isActive: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {item.children ? (
        // Dropdown menu
        <div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
              isActive
                ? "text-accent-primary bg-accent-primary/10"
                : "text-text-secondary hover:text-text-primary hover:bg-background-tertiary",
              "touch-target"
            )}
          >
            {item.icon}
            {item.label}
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "absolute top-full left-0 mt-2 py-2 min-w-48",
                  "bg-background-secondary border border-border-primary rounded-lg shadow-lg"
                )}
              >
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {child.icon}
                      {child.label}
                      {child.badge && (
                        <span className="ml-auto text-xs bg-accent-primary text-white px-1.5 py-0.5 rounded">
                          {child.badge}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        // Regular link
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
            isActive
              ? "text-accent-primary bg-accent-primary/10"
              : "text-text-secondary hover:text-text-primary hover:bg-background-tertiary",
            "touch-target"
          )}
        >
          {item.icon}
          {item.label}
          {item.badge && (
            <span className="ml-1 text-xs bg-accent-primary text-white px-1.5 py-0.5 rounded">
              {item.badge}
            </span>
          )}
        </Link>
      )}
    </div>
  );
}

// User Dropdown Component
function UserDropdown({ 
  userName, 
  onAction 
}: { 
  userName: string; 
  onAction: (action: string) => void;
}) {
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={cn(
        "absolute top-full right-0 mt-2 w-48 py-2",
        "border border-border-primary rounded-lg shadow-lg",
        componentConfig.glassmorphism ? getGlassClass() : "bg-background-secondary"
      )}
    >
      <div className="px-4 py-2 border-b border-border-primary/20">
        <p className="text-sm font-medium text-text-primary">{userName}</p>
        <p className="text-xs text-text-tertiary">Premium Account</p>
      </div>
      
      <button
        onClick={() => onAction('profile')}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors text-left"
      >
        <User className="w-4 h-4" />
        Profile
      </button>
      
      <button
        onClick={() => onAction('settings')}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors text-left"
      >
        <Settings className="w-4 h-4" />
        Settings
      </button>
      
      <hr className="my-1 border-border-primary/20" />
      
      <button
        onClick={() => onAction('logout')}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-status-error hover:text-status-error/80 hover:bg-status-error/10 transition-colors text-left"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </motion.div>
  );
}

// Mobile Menu Component
function MobileMenu({
  items,
  searchQuery,
  onSearchChange,
  onSearch,
  showSearch,
  isActiveRoute,
}: {
  items: NavItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
  showSearch: boolean;
  isActiveRoute: (href: string) => boolean;
}) {
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "md:hidden border-t border-border-primary/20",
        componentConfig.glassmorphism ? getGlassClass() : "bg-background-primary"
      )}
    >
      <div className="px-4 py-4 space-y-4">
        {/* Mobile Search */}
        {showSearch && (
          <form onSubmit={onSearch}>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className={cn(
                  "w-full pl-10 pr-4 py-3 text-sm rounded-lg",
                  "bg-background-secondary border border-border-primary",
                  "focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary",
                  "placeholder:text-text-tertiary",
                  "touch-target"
                )}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            </div>
          </form>
        )}

        {/* Mobile Navigation Items */}
        <div className="space-y-2">
          {items.map((item) => (
            <MobileNavItem 
              key={item.href}
              item={item}
              isActive={isActiveRoute(item.href)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Mobile Navigation Item Component
function MobileNavItem({ 
  item, 
  isActive 
}: { 
  item: NavItem; 
  isActive: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
            isActive
              ? "text-accent-primary bg-accent-primary/10"
              : "text-text-secondary hover:text-text-primary hover:bg-background-tertiary",
            "touch-target"
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon}
            {item.label}
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ml-4 mt-2 space-y-1"
            >
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-lg transition-colors"
                >
                  {child.icon}
                  {child.label}
                  {child.badge && (
                    <span className="ml-auto text-xs bg-accent-primary text-white px-1.5 py-0.5 rounded">
                      {child.badge}
                    </span>
                  )}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-accent-primary/50",
        isActive
          ? "text-accent-primary bg-accent-primary/10"
          : "text-text-secondary hover:text-text-primary hover:bg-background-tertiary",
        "touch-target"
      )}
    >
      {item.icon}
      {item.label}
      {item.badge && (
        <span className="ml-auto text-xs bg-accent-primary text-white px-1.5 py-0.5 rounded">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// Default navigation items for THub
export const defaultNavItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <Home className="w-4 h-4" />,
  },
  {
    label: 'Signals',
    href: '/signals',
    icon: <TrendingUp className="w-4 h-4" />,
    badge: '3',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="w-4 h-4" />,
  },
];