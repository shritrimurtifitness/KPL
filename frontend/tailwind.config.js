/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cricket: {
          dark: '#0B0F19', // Deep navy black
          card: '#131B2E', // Navy slate surface
          cardHover: '#1A243D',
          border: '#1E293B',
          accent: '#10B981', // Emerald turf green
          accentHover: '#059669',
          gold: '#F59E0B',   // Trophy gold
          goldHover: '#D97706',
          cyan: '#38BDF8',
          textMuted: '#94A3B8',
          danger: '#EF4444',
          warning: '#F59E0B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Montserrat', 'sans-serif']
      }
    },
  },
  plugins: [],
}
