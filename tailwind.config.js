/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#38B2AC', // sky-400
        secondary: '#A0AEC0', // indigo-300
        success: '#10B981', // emerald-500
        danger: '#F43F5E', // rose-500
        'bg-calm': '#F1F5F9', // slate-100
        'surface-light': '#FFFFFF',
        'text-main': '#374151', // slate-700
        'text-secondary': '#94A3B8', // slate-400
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
        minecraft: ['Press Start 2P', 'monospace'],
      },
      animation: {
        'fade-in-scale': 'fadeInScale 0.3s ease-in-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
