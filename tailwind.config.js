/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sleepnumber': {
          blue: '#004b8c',
          'blue-dark': '#003366',
          'blue-light': '#0066b3',
        }
      }
    },
  },
  plugins: [],
}
