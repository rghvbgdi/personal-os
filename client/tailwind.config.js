/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      height: {
        dvh: '100dvh',
        'dvh-screen': '100dvh',
      },
      minHeight: {
        dvh: '100dvh',
      },
      colors: {
        background: '#1C1917',
        surface: '#282320',
        'surface-2': '#312D2A',
        border: '#403C39',
        'border-subtle': '#2D2926',
        accent: {
          DEFAULT: '#D97757',
          hover: '#C96B47',
          subtle: '#3A1A0A',
          muted: '#5A2C15',
          light: '#F0AD91',
        },
        text: {
          primary: '#F5EDE0',
          secondary: '#A8A29E',
          muted: '#78716C',
        },
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#60a5fa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
      boxShadow: {
        'elevated': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'card': 'none',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [
    // scrollbar-hide utility for overflow-x scroll containers
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      });
    },
  ],
};
