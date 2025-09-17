import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background system
        background: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--bg-tertiary) / <alpha-value>)',
          overlay: 'rgb(var(--bg-overlay) / <alpha-value>)',
        },
        // Glass system
        glass: {
          surface: {
            light: 'var(--glass-surface-light)',
            medium: 'var(--glass-surface-medium)',
            heavy: 'var(--glass-surface-heavy)',
            // Legacy support
            DEFAULT: 'var(--glass-surface-medium)',
          },
          border: {
            light: 'var(--glass-border-light)',
            medium: 'var(--glass-border-medium)',
            heavy: 'var(--glass-border-heavy)',
            // Legacy support
            DEFAULT: 'var(--glass-border-medium)',
          },
        },
        // Text system
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          disabled: 'rgb(var(--text-disabled) / <alpha-value>)',
        },
        // Accent colors
        accent: {
          primary: 'rgb(var(--accent-primary) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--accent-tertiary) / <alpha-value>)',
          quaternary: 'rgb(var(--accent-quaternary) / <alpha-value>)',
        },
        // Status colors
        status: {
          success: 'rgb(var(--status-success) / <alpha-value>)',
          warning: 'rgb(var(--status-warning) / <alpha-value>)',
          error: 'rgb(var(--status-error) / <alpha-value>)',
          info: 'rgb(var(--status-info) / <alpha-value>)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, rgb(var(--accent-primary)) 0%, rgb(var(--accent-secondary)) 100%)',
        'gradient-secondary': 'linear-gradient(135deg, rgb(var(--accent-secondary)) 0%, #1d4ed8 100%)',
        'gradient-aurora': 'linear-gradient(135deg, rgb(var(--accent-primary)) 0%, rgb(var(--accent-secondary)) 50%, rgb(var(--accent-tertiary)) 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'touch-min': 'var(--touch-target-min)',
        'touch': 'var(--touch-target-comfortable)',
        'touch-lg': 'var(--touch-target-accessible)',
      },
      minWidth: {
        'touch-min': 'var(--touch-target-min)',
        'touch': 'var(--touch-target-comfortable)',
        'touch-lg': 'var(--touch-target-accessible)',
      },
      boxShadow: {
        'glass-sm': 'var(--shadow-glass-sm)',
        'glass-md': 'var(--shadow-glass-md)',
        'glass-lg': 'var(--shadow-glass-lg)',
        'glass-xl': 'var(--shadow-glass-xl)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'radar-draw': 'radarDraw 1s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        radarDraw: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.glass-light': {
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          'background': 'var(--glass-surface-light)',
          'border': '1px solid var(--glass-border-light)',
          'box-shadow': 'var(--shadow-glass-sm)',
        },
        '.glass-medium': {
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'background': 'var(--glass-surface-medium)',
          'border': '1px solid var(--glass-border-medium)',
          'box-shadow': 'var(--shadow-glass-md)',
        },
        '.glass-heavy': {
          'backdrop-filter': 'blur(32px)',
          '-webkit-backdrop-filter': 'blur(32px)',
          'background': 'var(--glass-surface-heavy)',
          'border': '1px solid var(--glass-border-heavy)',
          'box-shadow': 'var(--shadow-glass-lg)',
        },
        '.gpu-accelerated': {
          'transform': 'translate3d(0, 0, 0)',
          'will-change': 'transform',
        },
        '.gradient-text': {
          'background': 'linear-gradient(135deg, rgb(var(--accent-primary)) 0%, rgb(var(--accent-secondary)) 100%)',
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          'color': 'transparent',
        },
      });
    },
  ],
}

export default config