/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      animation: {
        'fade-up': 'fadeUp 0.45s ease-out',
        float: 'float 8s ease-in-out infinite',
        glow: 'glow 2.8s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(56, 189, 248, 0.18), 0 24px 60px rgba(15, 23, 42, 0.45)',
      },
      colors: {
        accent: {
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
        },
        panel: '#0f172a',
        surface: '#111827',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(34,211,238,0.18), 0 0 30px rgba(34,211,238,0.12)' },
          '50%': { boxShadow: '0 0 0 1px rgba(34,211,238,0.28), 0 0 45px rgba(34,211,238,0.18)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
