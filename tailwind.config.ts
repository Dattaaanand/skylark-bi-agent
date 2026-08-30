import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161A1D",
        paper: "#F6F5F1",
        line: "#DBD8CF",
        accent: "#2E5339", // deep field green — nods to drone/aerial survey work
        accentSoft: "#DCE6DE",
        rust: "#B3542C", // warning / low-confidence accent
        sky: "#3B6E8F", // info accent
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
