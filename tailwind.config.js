/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
    fontFamily: {
      sans: ["Helvetica", "ui-sans-serif", "system-ui"],
      notoSerifBangla: ["Noto Serif Bengali", "serif"],
    },
  },
  daisyui: {
    themes: ["lofi"],
  },
  // eslint-disable-next-line no-undef
  plugins: [require("daisyui"), require("@tailwindcss/forms")],
};
