/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        instagram: '#E1306C',
        facebook: '#1877F2',
        youtube: '#FF0000',
        tiktok: '#00F2FE'
      }
    },
  },
  plugins: [],
}
