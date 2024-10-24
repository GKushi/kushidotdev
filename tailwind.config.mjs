/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: "#123440",
        secondary: "#40798C",
        accent: "#E3DAE7",
        background: "#ECE6EF",
      },
    },
  },
  plugins: [],
};
