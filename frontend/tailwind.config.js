/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10172A",
        base: "#F7F8FA",
        laundry: {
          DEFAULT: "#2D7DD2",
          light: "#E8F1FC",
          dark: "#1E5A9C",
        },
        food: {
          DEFAULT: "#E8823C",
          light: "#FDEEE1",
          dark: "#B8611F",
        },
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
