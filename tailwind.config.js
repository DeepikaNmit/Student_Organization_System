/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#17254C', 700: '#22336A', 50: '#EEF0F8' },
        cyan: { clustro: '#8BDCF3' },
        lav: '#C8B6F4',
        pinky: '#F1C5E8',
        surface: '#F7F8FC',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
