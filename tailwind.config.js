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
        dotReveal: {
          '0%':   { opacity: '0', transform: 'scale(0)' },
          '60%':  { opacity: '1', transform: 'scale(1.3)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'dot-reveal': 'dotReveal 0.35s ease-out forwards',
      },
    },
  },
  plugins: [],
};