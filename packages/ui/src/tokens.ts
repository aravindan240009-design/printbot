/**
 * Design Tokens for Xerox PrintFlow SaaS & Workstation UI
 * Supports Web (Next.js) and Windows Desktop (Tauri 2)
 */

export const tokens = {
  colors: {
    brand: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // Primary Brand Indigo
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    neutral: {
      surfaceLight: '#f8fafc',
      surfaceDark: '#0b0f19',
      cardLight: '#ffffff',
      cardDark: '#111827',
      borderLight: '#e2e8f0',
      borderDark: '#1f2937',
      textPrimaryLight: '#0f172a',
      textPrimaryDark: '#f8fafc',
      textSecondaryLight: '#64748b',
      textSecondaryDark: '#94a3b8',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    },
  },
  typography: {
    fontSans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: '"JetBrains Mono", Consolas, "Courier New", monospace',
    scale: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1.0rem',     // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
  },
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '1.0rem',  // 16px
    lg: '1.5rem',  // 24px
    xl: '2.0rem',  // 32px
    '2xl': '3.0rem',// 48px
  },
  radii: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1.0rem',   // 16px
    full: '9999px',
  },
  elevation: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  transitions: {
    quick: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    standard: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: '350ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  breakpoints: {
    mobile: '360px',
    tablet: '768px',
    laptop: '1024px',
    desktop: '1280px',
    workstation: '1920px',
  },
};
