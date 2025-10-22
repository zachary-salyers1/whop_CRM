import { frostedThemePlugin } from "@whop/react/tailwind";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e0f7ff",
          100: "#b3ebff",
          200: "#80ddff",
          300: "#4dd0ff",
          400: "#26c6ff",
          500: "#00bcff",
          600: "#00a8e6",
          700: "#0091cc",
          800: "#007ab3",
          900: "#005580",
          950: "#003d5c",
        },
      },
    },
  },
  plugins: [frostedThemePlugin()],
} satisfies Config;
