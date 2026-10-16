/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'warm-ivory': '#F7F4EE',
        'warm-surface': '#FFFEFB',
        'warm-secondary-surface': '#E9E0D3',
        'warm-primary': '#302E29',
        'warm-secondary': '#625C53',
        'warm-terracotta': '#A9573F',
        'warm-forest': '#34483D',
        'warm-border': '#D8D0C4',
      },
    },
  },
  plugins: [],
};

