/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#8870D0',
        secondary: '#0F172A',
        background: '#0F172A',
        surface: '#1E293B',
        text: '#F1F5F9',
        'text-secondary': '#94A3B8',
      },
    },
  },
  plugins: [],
};















