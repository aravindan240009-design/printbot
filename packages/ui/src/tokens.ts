/**
 * Universal Design Tokens for Print Bot SaaS, Customer Mobile PWA & Windows Desktop Workstation
 * Aesthetic: Industrial Precision & Tactile Atelier (Obsidian, Milled Steel, Japanese Paper, Cyan Laser & Gold Foil)
 */

export const tokens = {
  colors: {
    // Brand Accent: Laser Cyan (Activity, Scanning, Spooling)
    cyan: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      laser: '#00e5ff',
    },
    // Premium Accent: Gold Foil & Machined Brass (Verified badges, subscription, locked quotes)
    brass: {
      50: '#fbf8ea',
      100: '#f6efc8',
      200: '#eedf91',
      300: '#e5ca57',
      400: '#ddb42b',
      500: '#d9bd8c',
      600: '#b89025',
      700: '#926c1e',
      800: '#77551d',
      900: '#64461d',
    },
    // Dark Room Surfaces (Obsidian, Slate, Milled Steel)
    dark: {
      bg: '#211219',
      surface: '#301e27',
      raised: '#3c2832',
      elevated: '#49323c',
      borderSubtle: 'rgba(255, 255, 255, 0.08)',
      borderStrong: 'rgba(255, 255, 255, 0.16)',
      borderActive: '#00e5ff',
      textPrimary: '#f1ede5',
      textMuted: '#b5afa5',
      textSubtle: '#aaa296',
    },
    // Light Room Surfaces (Tactile Japanese Paper, Warm Off-White, Crisp Card)
    light: {
      bg: '#f6efdf',
      surface: '#ffffff',
      raised: '#eeebe4',
      elevated: '#e5ded2',
      borderSubtle: 'rgba(0, 0, 0, 0.08)',
      borderStrong: 'rgba(0, 0, 0, 0.16)',
      borderActive: '#0891b2',
      textPrimary: '#39232d',
      textMuted: '#705c60',
      textSubtle: '#b5afa5',
    },
    // Semantic Status Tokens
    status: {
      success: '#10b981',
      successBg: 'rgba(16, 185, 129, 0.12)',
      warning: '#f59e0b',
      warningBg: 'rgba(245, 158, 11, 0.12)',
      danger: '#ef4444',
      dangerBg: 'rgba(239, 68, 68, 0.12)',
      info: '#0ea5e9',
      infoBg: 'rgba(14, 165, 233, 0.12)',
    },
  },
  typography: {
    fontDisplay: '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSans: '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: '"JetBrains Mono", "SF Mono", Consolas, Menlo, monospace',
    scale: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1.0rem',    // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3.0rem',   // 48px
      '6xl': '3.75rem',  // 60px
    },
  },
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1.0rem',   // 16px
    lg: '1.5rem',   // 24px
    xl: '2.0rem',   // 32px
    '2xl': '3.0rem',// 48px
    '3xl': '4.0rem',// 64px
  },
  radii: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1.0rem',   // 16px
    '2xl': '1.5rem',// 24px
    full: '9999px',
  },
  elevation: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 12px 28px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.08)',
    xl: '0 24px 56px rgba(0, 0, 0, 0.22), 0 8px 16px rgba(0, 0, 0, 0.12)',
    glowCyan: '0 0 24px rgba(0, 229, 255, 0.25)',
    glowGold: '0 0 24px rgba(212, 175, 55, 0.25)',
  },
  transitions: {
    quick: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
    standard: '250ms cubic-bezier(0.16, 1, 0.3, 1)',
    smooth: '400ms cubic-bezier(0.16, 1, 0.3, 1)',
    spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  breakpoints: {
    mobileSmall: '320px',
    mobile: '375px',
    mobileLarge: '430px',
    tablet: '768px',
    laptop: '1024px',
    desktop: '1280px',
    wide: '1536px',
    workstation: '1920px',
  },
};
