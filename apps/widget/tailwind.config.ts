/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#FFFFFF',
          1: '#F7F7F5',
          2: '#EFEEEA',
        },
        border: {
          DEFAULT: '#E2E1DC',
          strong: '#C7C6BF',
        },
        text: {
          primary: '#1F1E1B',
          secondary: '#5B5A54',
          muted: '#8B8A82',
        },
        brand: {
          50: '#EEF2FF',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
        },
        success: { 50: '#EAF3DE', 600: '#3B6D11' },
        danger: { 50: '#FCEBEB', 600: '#A32D2D' },
        warning: { 50: '#FAEEDA', 600: '#854F0B' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
};
