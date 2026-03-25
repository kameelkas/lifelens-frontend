/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "app-bg": "#E4F0FF",
        "ink": "#001B3A",
        "muted": "#18191B",
        "brand-gold": "#D7A319",
        "brand-red": "#370A16",
      },
    },
  },
  plugins: [],
};