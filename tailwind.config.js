/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "app-bg":      "rgb(var(--color-app-bg) / <alpha-value>)",
        "ink":         "rgb(var(--color-ink) / <alpha-value>)",
        "muted":       "rgb(var(--color-muted) / <alpha-value>)",
        "brand-gold":  "rgb(var(--color-brand-gold) / <alpha-value>)",
        "brand-red":   "rgb(var(--color-brand-red) / <alpha-value>)",
        "surface":     "rgb(var(--color-surface) / <alpha-value>)",
        "surface-alt": "rgb(var(--color-surface-alt) / <alpha-value>)",
      },
      keyframes: {
        "live-sync-bar": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(350%)" },
        },
      },
      animation: {
        "live-sync-bar": "live-sync-bar 1.35s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};