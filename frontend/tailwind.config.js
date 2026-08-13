module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        henna: { DEFAULT: "#4A1C17", light: "#6B2D25", deep: "#33110D" },
        gold: { DEFAULT: "#C5A059", shimmer: "#E5C17A", dim: "#8A6E3B" },
        sandalwood: { DEFAULT: "#F4EBD0", paper: "#FAF5E6" },
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "serif"],
        sans: ["Montserrat", "sans-serif"],
      },
      letterSpacing: {
        ritual: "0.35em",
      },
    },
  },
  plugins: [],
};
