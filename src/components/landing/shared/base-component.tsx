import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/themes/use-theme';
import type { ThemeAwareProps } from '@/types/landing.types';

interface BaseComponentProps extends ThemeAwareProps {
  variant?: 'card' | 'section' | 'hero';
  animated?: boolean;
}

export function BaseComponent({ 
  children, 
  className, 
  variant = 'card',
  animated = false 
}: BaseComponentProps) {
  const { theme } = useTheme();
  
  return (
    <div
      className={cn(
        // Base styles
        "relative transition-all duration-300",
        
        // Variant styles
        variant === 'card' && [
          "rounded-2xl p-6",
          theme === 'synthwave' ? [
            "bg-glass-surface",
            "border border-glass-border",
            "shadow-neon"
          ] : [
            "glass-card",
            "hover:shadow-lg"
          ]
        ],
        
        variant === 'section' && [
          "py-20",
          theme === 'synthwave' ? [
            "bg-gradient-to-b from-bg-primary/50 to-bg-secondary/30"
          ] : [
            "bg-gradient-to-b from-bg-primary/30 to-bg-secondary/20"
          ]
        ],
        
        variant === 'hero' && [
          "min-h-screen flex items-center justify-center overflow-hidden",
          theme === 'synthwave' ? [
            "bg-gradient-to-br from-bg-primary via-bg-tertiary to-bg-secondary"
          ] : [
            "bg-gradient-to-br from-bg-primary via-bg-tertiary to-bg-secondary"
          ]
        ],
        
        // Animation
        animated && "animate-shimmer",
        
        // Custom classes
        className
      )}
    >
      {children}
    </div>
  );
}