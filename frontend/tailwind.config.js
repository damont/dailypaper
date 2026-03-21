/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        headline: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Lora', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
