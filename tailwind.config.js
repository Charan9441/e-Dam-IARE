/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        background: "#030305",
        surface: "#0B0614",
        primary: {
          DEFAULT: "#8B5CF6",
          bright: "#A855F7",
          deep: "#5B21B6",
          lavender: "#C4B5FD",
        },
        text: {
          DEFAULT: "#F5F3FF",
          muted: "#928A9F",
        },
        muted: {
          DEFAULT: "#928A9F",
          foreground: "#928A9F",
        },
        border: "rgba(139,92,246,0.20)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
