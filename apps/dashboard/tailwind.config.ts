/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#FFFFFF',
          1: '#F8FAFC',
          2: '#F1F5F9',
          3: '#E2E8F0',
        },
        border: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
        },
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        success: { 50: '#ECFDF5', 600: '#059669', 700: '#047857' },
        danger: { 50: '#FEF2F2', 600: '#DC2626', 700: '#B91C1C' },
        warning: { 50: '#FFFBEB', 600: '#D97706', 700: '#B45309' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
