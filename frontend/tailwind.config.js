/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#070a12',
          card: '#0f172a',
          surface: '#131b2e',
          border: '#1e293b',
          borderGlow: '#312e81',
          accent: '#6366f1',
          teal: '#14b8a6',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          purple: '#a855f7',
          cyan: '#06b6d4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'cyber-sm': '0 0 15px -3px rgba(99, 102, 241, 0.25)',
        'cyber-md': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'cyber-lg': '0 0 40px -10px rgba(99, 102, 241, 0.45)',
        'teal-glow': '0 0 25px -5px rgba(20, 184, 166, 0.35)',
        'emerald-glow': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'purple-glow': '0 0 25px -5px rgba(168, 85, 247, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
