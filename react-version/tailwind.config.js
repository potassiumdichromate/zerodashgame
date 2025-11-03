/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
      },
      colors: {
        zerion: {
          // Primary Zerion Blues
          'blue-dark': '#0A1628',      // Deep navy background
          'blue-medium': '#1a2d4d',     // Medium blue
          'blue': '#2563eb',            // Bright Zerion blue
          'blue-light': '#3b82f6',      // Light blue accents
          'blue-glow': '#60a5fa',       // Glow effect blue
          
          // Zerion Yellows/Golds
          'yellow': '#ffd700',          // Bright yellow (logo)
          'yellow-dark': '#f59e0b',     // Darker yellow
          'yellow-glow': '#fbbf24',     // Yellow glow
          
          // Accents
          'purple': '#8b5cf6',          // Purple accent
          'cyan': '#06b6d4',            // Cyan accent
          'pink': '#ec4899',            // Pink highlight
          
          // Neutrals
          'dark': '#0f172a',            // Almost black
          'gray': '#334155',            // Gray
          'light': '#e2e8f0',           // Light gray/white
        },
      },
      boxShadow: {
        'pixel': '0 4px 0 #1a2d4d, 0 8px 0 #0A1628, 0 12px 20px rgba(0, 0, 0, 0.6)',
        'pixel-hover': '0 6px 0 #1a2d4d, 0 10px 0 #0A1628, 0 14px 25px rgba(37, 99, 235, 0.4)',
        'pixel-active': '0 2px 0 #1a2d4d, 0 4px 0 #0A1628, 0 6px 15px rgba(0, 0, 0, 0.6)',
        'gold-pixel': '0 4px 0 #f59e0b, 0 8px 0 #d97706, 0 12px 20px rgba(255, 215, 0, 0.4)',
        'gold-pixel-hover': '0 6px 0 #f59e0b, 0 10px 0 #d97706, 0 14px 25px rgba(255, 215, 0, 0.6)',
      },
      animation: {
        'gradient-shift': 'gradientShift 15s ease infinite',
        'logo-float': 'logoFloat 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        logoFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
      },
    },
  },
  plugins: [],
}