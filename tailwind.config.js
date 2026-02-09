/** @type {import('tailwindcss').Config} */
// Force rebuild
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pm: {
          graphite: "#0E0E10", // Base Background
          charcoal: "#161618", // Panel Surface
          iron: "#3A3A3C",     // Borders
          blood: "#9B0000",    // Warnings/Accents
          amber: "#D4AF37",    // System Text
          // Legacy/Fallback (keep specific useful ones if needed, or map them)
          black: "#0E0E10",    // Map black to graphite for backward compat
          red: "#9B0000",      // Map red to blood
          border: "#3A3A3C",   // Map border to iron
        }
      },
      fontFamily: {
        industrial: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        typewriter: ['"Special Elite"', 'cursive'],
        heading: ['"Archivo Black"', 'sans-serif'],
        serif: ['"Nanum Myeongjo"', 'serif'],
      },
      boxShadow: {
        'industrial': '0 0 10px rgba(148, 27, 27, 0.2)',
        'industrial-inner': 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}
