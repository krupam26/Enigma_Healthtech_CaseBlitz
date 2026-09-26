import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          950: '#062B29',
          800: '#0E4744',
          700: '#177670',
          600: '#177670',
          500: '#1E8C82',
        },
        mint: { 300: '#9FE0CB', 100: '#E4F7EF' },
        paper: '#FCFEFD',
        offwhite: '#F6FBF9',
        ink: '#0B2422',
        inksoft: '#4C6461',
        line: '#DCEAE6',
        amber: '#C97A34',
        risk: '#B5453B',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '20px' },
    },
  },
  plugins: [],
} satisfies Config
