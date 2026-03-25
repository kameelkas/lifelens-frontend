/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // LifeLens palette. Use semantic names (app-bg/ink/muted) for UI, and
        // accent/danger for semantic status colors.
        "app-bg": "#E4F0FF",
        "ink": "#001B3A",
        "muted": "#34466A",
        "brand-gold": "#D7A319",
        "brand-red": "#370A16",
      },
    },
  },
  plugins: [],
};