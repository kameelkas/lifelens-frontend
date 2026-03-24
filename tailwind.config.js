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
      keyframes: {
      fadeIn: {
        '0%':   { opacity: '0', transform: 'translateY(-6px) translateX(-50%)' },
        '100%': { opacity: '1', transform: 'translateY(0)   translateX(-50%)' },
      },
    },
    animation: {
      fadeIn: 'fadeIn 0.5s ease forwards',
    },
    },
  },
  plugins: [],
};