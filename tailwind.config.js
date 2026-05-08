/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'glass-border': 'rgba(255,255,255,0.08)',
        'glass-bg': 'rgba(255,255,255,0.04)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
