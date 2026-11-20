/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "obsidian-base": "#0A0B0E",
        "surface-elevation-1": "#121318",
        "surface-elevation-2": "#1A1C23",
        "surface-elevation-3": "#222530",
        "surface-container-lowest": "#0d0e11",
        "surface-container-low": "#1b1b1f",
        "surface-container": "#1f1f23",
        "surface-container-high": "#292a2d",
        "surface-container-highest": "#343538",
        "primary-container": "#FF6B00",
        "neon-amber": "#FF6B00",
        "neon-amber-glow": "rgba(255, 107, 0, 0.25)",
        "amber-bright": "#FF8C00",
        "amber-light": "#FFAE33",
        "amber-subtle": "rgba(255, 107, 0, 0.12)",
        "border-glass": "rgba(255, 255, 255, 0.08)",
        "border-amber-glow": "rgba(255, 107, 0, 0.35)",
        "text-primary": "#F8FAFC",
        "text-secondary": "#94A3B8",
        "text-tertiary": "#64748B",
        "status-success": "#10B981",
        "status-info": "#38BDF8",
        "status-warning": "#F59E0B",
        "status-error": "#EF4444",
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        }
      },
      fontFamily: {
        headline: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        code: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

