/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f6",
          100: "#d6ece9",
          200: "#aedad4",
          300: "#7fc2ba",
          400: "#4fa79c",
          500: "#2f8a7e",
          600: "#227067",
          700: "#1c5a54",
          800: "#1a4844",
          900: "#183c39",
        },
      },
    },
  },
  plugins: [],
};
