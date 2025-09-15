'use client';

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X,
  Check,
  AlertCircle,
  Info,
  Zap,
  Star,
  Crown,
  Flame,
  Shield,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgressiveEnhancementContext } from '@/components/providers/progressive-enhancement-provider';
import { useComponentEnhancement } from '@/lib/hooks/use-progressive-enhancement';

/**
 * Badge Component - Status badges, notification counts, and labels
 * 
 * Features:
 * - Multiple variants (solid, outline, ghost, glass)
 * - Status colors (success, warning, error, info)
 * - Sizes (xs, sm, md, lg)
 * - Interactive states with animations
 * - Icon support with auto-sizing
 * - Notification dot and count badges
 * - Custom content with glassmorphism effects
 * - Closable badges with smooth animations
 * - Touch-optimized for mobile
 * - Accessibility support
 * - Pulse and glow effects
 */

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'solid' | 'outline' | 'ghost' | 'glass' | 'gradient';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  shape?: 'rounded' | 'pill' | 'square';
  // Special badge types
  dot?: boolean;
  count?: number;
  maxCount?: number;
  // Icons
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  // Interactive
  closable?: boolean;
  onClose?: () => void;
  clickable?: boolean;
  // Effects
  pulse?: boolean;
  glow?: boolean;
  animate?: boolean;
  // Status
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void;
  'data-testid'?: string;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({
  children,
  variant = 'solid',
  color = 'primary',
  size = 'sm',
  shape = 'rounded',
  dot = false,
  count,
  maxCount = 99,
  icon,
  iconPosition = 'left',
  closable = false,
  onClose,
  clickable = false,
  pulse = false,
  glow = false,
  animate = true,
  status,
  className,
  onClick,
  'data-testid': testId
}, ref) => {
  const { config } = useProgressiveEnhancementContext();
  const { config: componentConfig, getGlassClass } = useComponentEnhancement('card');
  
  // Handle close action
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <div className="w-2 h-2 bg-status-success rounded-full" />;
      case 'offline': return <div className="w-2 h-2 bg-text-muted rounded-full" />;
      case 'busy': return <div className="w-2 h-2 bg-status-error rounded-full" />;
      case 'away': return <div className="w-2 h-2 bg-status-warning rounded-full" />;
      default: return null;
    }
  };
  
  // Display count with max limit
  const displayCount = count !== undefined && count > maxCount ? `${maxCount}+` : count?.toString();
  
  // Base classes
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-background-primary',
    // Shape
    shape === 'rounded' && 'rounded-lg',
    shape === 'pill' && 'rounded-full',
    shape === 'square' && 'rounded-none',
    // Size
    {
      'text-xs px-2 py-1 min-h-[20px] gap-1': size === 'xs',
      'text-xs px-2.5 py-1 min-h-[24px] gap-1.5': size === 'sm',
      'text-sm px-3 py-1.5 min-h-[28px] gap-2': size === 'md',
      'text-base px-4 py-2 min-h-[36px] gap-2': size === 'lg',
    },
    // Interactive states
    clickable && 'cursor-pointer hover:scale-105 active:scale-95',
    closable && 'pr-1',
    // Effects
    pulse && config.animations !== 'none' && 'animate-pulse',
    glow && componentConfig.animations && 'animate-glow',
    // Dot badge
    dot && 'w-3 h-3 p-0 min-h-0 rounded-full',
    className
  );
  
  // Color and variant classes
  const getVariantClasses = () => {
    const colorMap = {
      primary: {
        solid: 'bg-accent-primary text-white',
        outline: 'border border-accent-primary text-accent-primary bg-transparent',
        ghost: 'text-accent-primary hover:bg-accent-primary/10',
        glass: `${getGlassClass()} text-accent-primary border border-accent-primary/30`,
        gradient: 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white',
      },
      secondary: {
        solid: 'bg-accent-secondary text-white',
        outline: 'border border-accent-secondary text-accent-secondary bg-transparent',
        ghost: 'text-accent-secondary hover:bg-accent-secondary/10',
        glass: `${getGlassClass()} text-accent-secondary border border-accent-secondary/30`,
        gradient: 'bg-gradient-to-r from-accent-secondary to-accent-tertiary text-white',
      },
      success: {
        solid: 'bg-status-success text-white',
        outline: 'border border-status-success text-status-success bg-transparent',
        ghost: 'text-status-success hover:bg-status-success/10',
        glass: `${getGlassClass()} text-status-success border border-status-success/30`,
        gradient: 'bg-gradient-to-r from-status-success to-accent-tertiary text-white',
      },
      warning: {
        solid: 'bg-status-warning text-black',
        outline: 'border border-status-warning text-status-warning bg-transparent',
        ghost: 'text-status-warning hover:bg-status-warning/10',
        glass: `${getGlassClass()} text-status-warning border border-status-warning/30`,
        gradient: 'bg-gradient-to-r from-status-warning to-accent-quaternary text-black',
      },
      error: {
        solid: 'bg-status-error text-white',
        outline: 'border border-status-error text-status-error bg-transparent',
        ghost: 'text-status-error hover:bg-status-error/10',
        glass: `${getGlassClass()} text-status-error border border-status-error/30`,
        gradient: 'bg-gradient-to-r from-status-error to-red-400 text-white',
      },
      info: {
        solid: 'bg-status-info text-white',
        outline: 'border border-status-info text-status-info bg-transparent',
        ghost: 'text-status-info hover:bg-status-info/10',
        glass: `${getGlassClass()} text-status-info border border-status-info/30`,
        gradient: 'bg-gradient-to-r from-status-info to-accent-secondary text-white',
      },
      neutral: {
        solid: 'bg-text-muted text-white',
        outline: 'border border-text-muted text-text-muted bg-transparent',
        ghost: 'text-text-muted hover:bg-text-muted/10',
        glass: `${getGlassClass()} text-text-muted border border-text-muted/30`,
        gradient: 'bg-gradient-to-r from-text-muted to-text-secondary text-white',
      },
    };
    
    return colorMap[color][variant];
  };
  
  // Animation variants
  const animationVariants = animate && componentConfig.animations ? {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    whileHover: clickable && config.animations !== 'none' ? { scale: 1.05 } : undefined,
    whileTap: clickable && config.animations !== 'none' ? { scale: 0.95 } : undefined,
  } : {};
  
  // Render dot badge
  if (dot) {
    return (
      <motion.span
        ref={ref}
        className={cn(baseClasses, getVariantClasses())}
        data-testid={testId}
        {...animationVariants}
      >
        {glow && componentConfig.animations && (
          <div 
            className="absolute inset-0 rounded-full opacity-50 animate-ping"
            style={{
              background: `rgb(var(--accent-${color === 'primary' ? 'primary' : color}))`,
            }}
          />
        )}
      </motion.span>
    );
  }
  
  // Render count badge
  if (count !== undefined) {
    return (
      <motion.span
        ref={ref}
        className={cn(
          baseClasses,
          getVariantClasses(),
          'min-w-[24px] font-bold text-center leading-none'
        )}
        onClick={clickable ? onClick : undefined}
        data-testid={testId}
        {...animationVariants}
      >
        {displayCount}
        
        {glow && componentConfig.animations && (
          <motion.div 
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: `rgb(var(--accent-${color === 'primary' ? 'primary' : color}))`,
              filter: 'blur(8px)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.span>
    );
  }
  
  // Render standard badge
  return (
    <motion.span
      ref={ref}
      className={cn(baseClasses, getVariantClasses())}
      onClick={clickable ? onClick : undefined}
      data-testid={testId}
      {...animationVariants}
    >
      {/* Left icon or status */}
      {(icon && iconPosition === 'left') && (
        <span className={cn(
          'flex-shrink-0',
          size === 'xs' && '[&>svg]:w-3 [&>svg]:h-3',
          size === 'sm' && '[&>svg]:w-3.5 [&>svg]:h-3.5',
          size === 'md' && '[&>svg]:w-4 [&>svg]:h-4',
          size === 'lg' && '[&>svg]:w-5 [&>svg]:h-5'
        )}>
          {icon}
        </span>
      )}
      
      {status && (
        <span className="flex-shrink-0 mr-1">
          {getStatusIcon(status)}
        </span>
      )}
      
      {/* Content */}
      {children && (
        <span className="flex-1 min-w-0 truncate">
          {children}
        </span>
      )}
      
      {/* Right icon */}
      {(icon && iconPosition === 'right') && (
        <span className={cn(
          'flex-shrink-0',
          size === 'xs' && '[&>svg]:w-3 [&>svg]:h-3',
          size === 'sm' && '[&>svg]:w-3.5 [&>svg]:h-3.5',
          size === 'md' && '[&>svg]:w-4 [&>svg]:h-4',
          size === 'lg' && '[&>svg]:w-5 [&>svg]:h-5'
        )}>
          {icon}
        </span>
      )}
      
      {/* Close button */}
      {closable && (
        <motion.button
          onClick={handleClose}
          className={cn(
            'flex-shrink-0 ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors',
            size === 'xs' && '[&>svg]:w-2.5 [&>svg]:h-2.5',
            size === 'sm' && '[&>svg]:w-3 [&>svg]:h-3',
            size === 'md' && '[&>svg]:w-3.5 [&>svg]:h-3.5',
            size === 'lg' && '[&>svg]:w-4 [&>svg]:h-4'
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close"
        >
          <X />
        </motion.button>
      )}
      
      {/* Glow effect */}
      {glow && componentConfig.animations && (
        <motion.div 
          className="absolute inset-0 rounded-lg opacity-30 pointer-events-none"
          style={{
            background: `rgb(var(--accent-${color === 'primary' ? 'primary' : color}))`,
            filter: 'blur(8px)',
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.span>
  );
});

Badge.displayName = 'Badge';

export { Badge };

// Convenience components for common use cases
export const StatusBadge: React.FC<Omit<BadgeProps, 'color'> & { 
  status: 'online' | 'offline' | 'busy' | 'away' | 'success' | 'error' | 'warning' | 'info' 
}> = ({ status, ...props }) => {
  const colorMap = {
    online: 'success',
    offline: 'neutral',
    busy: 'error',
    away: 'warning',
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  } as const;
  
  return <Badge color={colorMap[status]} {...props} />;
};

export const CountBadge: React.FC<Omit<BadgeProps, 'children'> & { 
  count: number;
  showZero?: boolean;
}> = ({ count, showZero = false, ...props }) => {
  if (count === 0 && !showZero) return null;
  
  return (
    <Badge count={count} variant="solid" color="error" size="xs" {...props} />
  );
};

export const NotificationDot: React.FC<Omit<BadgeProps, 'children' | 'dot'>> = (props) => (
  <Badge dot color="error" pulse {...props} />
);

export const SuccessBadge: React.FC<Omit<BadgeProps, 'color'>> = (props) => (
  <Badge color="success" icon={<Check />} {...props} />
);

export const ErrorBadge: React.FC<Omit<BadgeProps, 'color'>> = (props) => (
  <Badge color="error" icon={<AlertCircle />} {...props} />
);

export const WarningBadge: React.FC<Omit<BadgeProps, 'color'>> = (props) => (
  <Badge color="warning" icon={<AlertCircle />} {...props} />
);

export const InfoBadge: React.FC<Omit<BadgeProps, 'color'>> = (props) => (
  <Badge color="info" icon={<Info />} {...props} />
);

export const PremiumBadge: React.FC<Omit<BadgeProps, 'color' | 'variant' | 'icon'>> = (props) => (
  <Badge 
    color="primary" 
    variant="gradient" 
    icon={<Crown />} 
    glow
    {...props} 
  />
);

export const HotBadge: React.FC<Omit<BadgeProps, 'color' | 'variant' | 'icon'>> = (props) => (
  <Badge 
    color="error" 
    variant="solid" 
    icon={<Flame />} 
    pulse
    {...props} 
  />
);

export const NewBadge: React.FC<Omit<BadgeProps, 'color' | 'variant' | 'icon'>> = (props) => (
  <Badge 
    color="success" 
    variant="solid" 
    icon={<Zap />} 
    glow
    {...props} 
  />
);

export const VIPBadge: React.FC<Omit<BadgeProps, 'color' | 'variant' | 'icon'>> = (props) => (
  <Badge 
    color="warning" 
    variant="gradient" 
    icon={<Star />} 
    glow
    {...props} 
  />
);

export const VerifiedBadge: React.FC<Omit<BadgeProps, 'color' | 'variant' | 'icon'>> = (props) => (
  <Badge 
    color="info" 
    variant="solid" 
    icon={<Shield />} 
    {...props} 
  />
);

export const FavoriteBadge: React.FC<Omit<BadgeProps, 'color' | 'variant' | 'icon'>> = (props) => (
  <Badge 
    color="error" 
    variant="ghost" 
    icon={<Heart />} 
    {...props} 
  />
);