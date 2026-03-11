/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // LifeLens brand palette — use these names everywhere, never raw hex
        "brand-navy":  "#34466A",
        "brand-gold":  "#D7A319",
        "brand-gray":  "#717787",
        "brand-red":   "#370A16",
      },
    },
  },
  plugins: [],
};