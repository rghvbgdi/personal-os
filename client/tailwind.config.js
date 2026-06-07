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
        background: '#0a0a0a',
        surface: '#171717',
        'surface-2': '#1f1f1f',
        border: '#262626',
        'border-subtle': '#1c1c1c',
        accent: {
          DEFAULT: '#059669',
          hover: '#047857',
          subtle: '#052e16',
          muted: '#064e3b',
        },
        text: {
          primary: '#fafafa',
          secondary: '#a3a3a3',
          muted: '#525252',
        },
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
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
        'glow-sm': '0 0 10px rgba(5, 150, 105, 0.15)',
        'glow': '0 0 20px rgba(5, 150, 105, 0.2)',
        'glow-lg': '0 0 40px rgba(5, 150, 105, 0.25)',
        'elevated': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
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
