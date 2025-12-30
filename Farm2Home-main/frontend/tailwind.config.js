/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#22c55e',
        secondary: '#3b82f6',
        accent: '#f97316',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        dark: '#0f172a',
      },
      spacing: {
        'safe-top': 'max(env(safe-area-inset-top), 0)',
        'safe-bottom': 'max(env(safe-area-inset-bottom), 0)',
      },
      borderRadius: {
        'lg': '16px',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
      },
    },
  },
  plugins: [],
}
