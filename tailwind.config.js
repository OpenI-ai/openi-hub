/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // OpenI primary gold — rgb(213,170,91) / #D5AA5B
        primary: {
          50:  '#fdf8ee',
          100: '#faefd2',
          200: '#f5dea5',
          300: '#eec96f',
          400: '#e6b845',
          500: '#D5AA5B',   // OpenI gold (buttons, CTA)
          600: '#CFA745',   // darker gold variant
          700: '#a87c28',
          800: '#7d5b1e',
          900: '#5c4118',
        },
        // OpenI dark — deep navy #252147 + near-black #111E21
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
          900: '#252147',   // OpenI deep navy
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
        navy: '#252147',
      },
      fontFamily: {
        sans: ['Lexend', 'sans-serif'],
        display: ['Lexend', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
