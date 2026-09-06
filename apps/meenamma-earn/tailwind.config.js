/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#060f11',
          900: '#0a1a1d',
          800: '#112b30',
          700: '#193f47',
          600: '#235964',
        },
        gold: {
          300: '#f9e2af',
          400: '#f3ca74',
          500: '#dfb15b',
          600: '#b88939',
        },
        cream: '#fdfbf7',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
