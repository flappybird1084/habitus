import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // uhabits 20-color palette
        palette: {
          0: "#D32F2F",   // red
          1: "#E64A19",   // deep orange
          2: "#F57C00",   // orange
          3: "#FF8F00",   // amber
          4: "#F9A825",   // yellow
          5: "#AFB42B",   // lime
          6: "#7CB342",   // light green
          7: "#388E3C",   // green
          8: "#00897B",   // teal
          9: "#00ACC1",   // cyan
          10: "#039BE5",  // light blue
          11: "#1976D2",  // blue
          12: "#303F9F",  // indigo
          13: "#5E35B1",  // deep purple
          14: "#8E24AA",  // purple
          15: "#D81B60",  // pink
          16: "#5D4037",  // brown
          17: "#424242",  // dark grey
          18: "#757575",  // grey
          19: "#9E9E9E",  // light grey
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "bounce-in": "bounceIn 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
