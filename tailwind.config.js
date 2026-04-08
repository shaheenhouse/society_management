/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#10b981", // Emerald 500
        secondary: "#3b82f6", // Blue 500
        danger: "#ef4444", // Red 500
        warning: "#f59e0b", // Amber 500
        success: "#22c55e", // Green 500
        background: "#f8fafc", // Slate 50
        card: "#ffffff",
      },
    },
  },
  plugins: [],
}
