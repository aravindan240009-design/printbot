/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#04070D',
          900: '#080C14',
          850: '#0A0F1D',
          800: '#0E1422',
          750: '#11182B',
          700: '#141C30',
          600: '#1C2640',
          500: '#2A3859',
        },
        gold: {
          50: '#FFFDF0',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      boxShadow: {
        'glow-gold': '0 0 25px rgba(245, 158, 11, 0.35)',
        'glow-gold-lg': '0 0 45px rgba(245, 158, 11, 0.5)',
        'glow-indigo': '0 0 25px rgba(99, 102, 241, 0.35)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.35)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.35)',
        'glow-rose': '0 0 25px rgba(244, 63, 94, 0.35)',
        'inner-gold': 'inset 0 0 15px rgba(245, 158, 11, 0.15)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'shimmer-fast': 'shimmer 1.5s infinite linear',
        'laser-scan': 'laserScan 2.4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 14s linear infinite',
        'radar': 'radar 4s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        laserScan: {
          '0%, 100%': { transform: 'translateY(-20px)', opacity: '0.2' },
          '50%': { transform: 'translateY(120px)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
