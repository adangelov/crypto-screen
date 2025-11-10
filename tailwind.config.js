/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#05070F',
        surface: '#0B1020',
        accent: {
          DEFAULT: '#00F28F',
          100: '#DCFCE7',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B'
        }
      },
      boxShadow: {
        card: '0 10px 40px -15px rgba(0, 242, 143, 0.35)'
      }
    }
  },
  plugins: []
};
