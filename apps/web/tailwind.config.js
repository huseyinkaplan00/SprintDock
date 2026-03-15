/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}', '../../packages/ui/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1337ec',
        'background-light': '#f6f6f8',
        'background-dark': '#101322',
        'surface-light': '#ffffff',
        'surface-dark': '#1e2030',
        'border-light': '#e5e7eb',
        'border-dark': '#2d3042',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
