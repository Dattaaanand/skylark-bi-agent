import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#FAFAFA", // zinc-50 (foreground text)
        paper: "#09090B", // zinc-950 (background)
        line: "#27272A", // zinc-800 (border)
        accent: "#FAFAFA", // zinc-50 (primary theme accent)
        accentSoft: "#27272A", // zinc-800 (secondary background)
        rust: "#EF4444", // red-500 (destructive / warning)
        sky: "#3B82F6", // blue-500 (info accent)
        brand: "#10B981", // emerald-500 (drone / aerial survey brand green)
        brandSoft: "#064E3B", // emerald-950 (subtle green branding)
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
