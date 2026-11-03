/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eaf5ee',
          100: '#cfe8d8',
          200: '#a8d2b5',
          300: '#7dbc92',
          400: '#56a672',
          500: '#3a8e59',
          600: '#2f7a4a',
          700: '#3a8e59',
          800: '#1f5a37',
          900: '#173f27',
        },
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
};
