import { frostedThemePlugin } from "@whop/react/tailwind";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Ensure color variants are available for dynamic styling
    'bg-green-950/50', 'text-green-400', 'border-green-800',
    'bg-yellow-950/50', 'text-yellow-400', 'border-yellow-800',
    'bg-red-950/50', 'text-red-400', 'border-red-800',
    'bg-orange-950/50', 'text-orange-400', 'border-orange-800',
    'bg-primary-950/50', 'text-primary-400', 'border-primary-800',
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
