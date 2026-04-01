/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e6eef2',
          100: '#b3ccd9',
          200: '#80aabf',
          300: '#4d88a6',
          400: '#1a668d',
          500: '#011A23',
          600: '#01151c',
          700: '#011015',
          800: '#000b0e',
          900: '#000607',
        },
        accent: {
          blue: '#2B5EA7',
          yellow: '#F5A623',
          green: '#10B981',
          red: '#EF4444',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
