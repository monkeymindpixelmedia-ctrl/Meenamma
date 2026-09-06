/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          950: '#071619',
          900: '#0b2328',
          800: '#10373f',
          700: '#164f5a',
          500: '#10b981',
          400: '#34d399',
        },
        coral: {
          400: '#fb7185',
          500: '#f43f5e',
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
