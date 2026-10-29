/**
 * Print Bot Customer Web Portal - Centralized Design Tokens
 * Grounded in authentic Indian print-shop aesthetics:
 * Rich tactile surfaces, crisp typography, accessible touch targets, and high-contrast feedback.
 */

export const tokens = {
  colors: {
    brand: {
      50: '#eef6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#2563eb', // Core Vibrant Royal Indigo
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#172554',
      950: '#0b1329',
    },
    cyan: {
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
    },
    emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
    amber: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    rose: {
      50: '#fff1f2',
      100: '#ffe4e6',
      500: '#f43f5e',
      600: '#e11d48',
    },
    light: {
      bg: '#f8fafc',
      surface: '#ffffff',
      raised: '#f1f5f9',
      border: '#e2e8f0',
      borderFocus: '#2563eb',
      rule: '#edf2f7',
      text: '#0f172a',
      muted: '#64748b',
      faint: '#94a3b8',
      cardHover: '#f8faff',
    },
    dark: {
      bg: '#0a0f1d',
      surface: '#121929',
      raised: '#1a243b',
      border: '#24324f',
      borderFocus: '#60a5fa',
      rule: '#1f2a42',
      text: '#f8fafc',
      muted: '#94a3b8',
      faint: '#64748b',
      cardHover: '#182238',
    },
  },
  typography: {
    fontSans: 'Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontDisplay: 'Outfit, Manrope, sans-serif',
    fontMono: '"JetBrains Mono", Consolas, "Courier New", monospace',
    scale: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1.0rem',    // 16px
      md: '1.125rem',   // 18px
      lg: '1.25rem',    // 20px
      xl: '1.5rem',     // 24px
      '2xl': '1.875rem',// 30px
      '3xl': '2.25rem', // 36px
      '4xl': '2.75rem', // 44px
    },
  },
  spacing: {
    1: '0.25rem', // 4px
    2: '0.5rem',  // 8px
    3: '0.75rem', // 12px
    4: '1.0rem',  // 16px
    5: '1.25rem', // 20px
    6: '1.5rem',  // 24px
    8: '2.0rem',  // 32px
    10: '2.5rem', // 40px
    12: '3.0rem', // 48px
  },
  radii: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  touchTarget: {
    minHeight: '44px',
    minWidth: '44px',
  },
  elevation: {
    sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.03)',
    xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.04)',
    glow: '0 0 25px rgba(37,99,235,0.25)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: '350ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
};
