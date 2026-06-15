/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          150: "#e9ecef",
          250: "#dee2e6",
          650: "#495057",
          655: "#495057",
          750: "#343a40",
          850: "#212529",
          855: "#212529"
        }
      }
    }
  },
  plugins: [],
}
