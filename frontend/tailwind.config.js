/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arc: {
          500: '#22c55e',
          600: '#16a34a',
        },
        usdc: {
          500: '#2775ca',
        }
      }
    },
  },
  plugins: [],
}
