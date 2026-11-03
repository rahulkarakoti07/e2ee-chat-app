/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#050508',
          subtle: '#090a0f',
          surface: '#0f1017',
          card: '#151622',
          border: 'rgba(255, 255, 255, 0.08)',
          cyan: '#00f0ff',
          'cyan-dim': '#00b8c4',
          purple: '#9945ff',
          'purple-dim': '#7928ca',
          pink: '#ff007a',
          emerald: '#10b981',
          danger: '#ff3366',
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 240, 255, 0.4)',
        'glow-cyan-lg': '0 0 35px -5px rgba(0, 240, 255, 0.5)',
        'glow-purple': '0 0 20px -3px rgba(153, 69, 255, 0.4)',
        'glow-purple-lg': '0 0 35px -5px rgba(153, 69, 255, 0.5)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-breathe': 'breathe 3s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        breathe: {
          '0%': { opacity: '0.4', filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.3))' },
          '100%': { opacity: '0.8', filter: 'drop-shadow(0 0 22px rgba(0,240,255,0.6))' },
        }
      }
    },
  },
  plugins: [],
}
