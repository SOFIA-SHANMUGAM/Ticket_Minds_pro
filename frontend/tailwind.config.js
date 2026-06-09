/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#36393f',
          darker: '#2f3136',
          darkest: '#202225',
          blurple: '#5865F2',
          green: '#57F287',
          yellow: '#FEE75C',
          red: '#ED4245',
          text: '#dcddde',
          textMuted: '#72767d',
        }
      }
    },
  },
  plugins: [],
}
