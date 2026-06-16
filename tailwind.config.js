/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // OpenI primary gold — rgb(208,168,72) / #D0A848 (brand kit standard)
        primary: {
          50:  '#fbf6ea',
          100: '#f5e9c6',
          200: '#ecd28d',
          300: '#e0bb5b',
          400: '#d9b251',
          500: '#D0A848',   // OpenI gold (buttons, CTA)
          600: '#b8923a',   // darker gold variant
          700: '#94742d',
          800: '#6e5722',
          900: '#4f3e19',
        },
        // OpenI dark — deep navy #152838 (brand kit standard) + near-black #111E21
        dark: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#152838',   // OpenI deep navy
          950: '#111E21',   // OpenI darkest bg
        },
        // OpenI accent blue — rgb(110,193,228) / #6EC1E4
        accent: {
          100: '#e8f6fc',
          200: '#bce8f6',
          300: '#8ed4ee',
          400: '#6EC1E4',   // OpenI blue accent
          500: '#3eadd8',
          600: '#1d8fb8',
        },
        // Keep green for status indicators
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        navy: '#152838',
      },
      fontFamily: {
        sans: ['Lexend', 'sans-serif'],
        display: ['Lexend', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
