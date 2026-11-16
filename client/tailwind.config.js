/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dce6ff',
          200: '#bccfff',
          300: '#8aadff',
          400: '#5180ff',
          500: '#2457f5',
          600: '#1a3fea',
          700: '#142fcd',
          800: '#1629a6',
          900: '#172883',
        },
        surface: '#f8fafc',
        muted: '#94a3b8',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.06)',
      },
    },
  },
  plugins: [],
};
