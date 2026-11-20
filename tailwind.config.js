/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.06)',
        soft: '0 4px 16px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};
