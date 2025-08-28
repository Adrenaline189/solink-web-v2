/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",            // ⬅️ ต้องเป็น 'class'
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
