module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        obsidian: { DEFAULT: "#0A0A0A", light: "#1A1A1A", deep: "#000000" },
        alabaster: { DEFAULT: "#FAFAFA", paper: "#F2EFE9" },
        gold: { DEFAULT: "#C5A059", shimmer: "#E5C17A", dim: "#8A6E3B" },
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "serif"],
        sans: ["'Outfit'", "sans-serif"],
      },
      letterSpacing: {
        ritual: "0.35em",
        luxury: "0.25em",
      },
    },
  },
  plugins: [],
};
