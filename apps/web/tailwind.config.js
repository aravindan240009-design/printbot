/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        regal: {
          burgundy: '#4e1c31',
          gold: '#c5a059',
          brass: '#a67c45',
          linen: '#fdfbfa',
          surface: '#fffdfa',
          charcoal: '#15100f',
        },
      },
      boxShadow: {
        'glow-gold': '0 0 25px rgba(197, 160, 89, 0.35)',
        'glow-burgundy': '0 0 25px rgba(78, 28, 49, 0.35)',
        'regal': '0 8px 32px rgba(21, 16, 15, 0.08)',
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
