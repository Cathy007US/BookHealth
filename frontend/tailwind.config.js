/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8fcef',
          100: '#c7f9d8',
          200: '#9ff0b6',
          300: '#6ae48f',
          400: '#3dd56c',
          500: '#00a13b',
          600: '#009035',
          700: '#00762c',
          800: '#005d24',
          900: '#004a1e',
        },
      },
      maxWidth: {
        mobile: '430px',
      },
    },
  },
  plugins: [],
};
