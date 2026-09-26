import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          pine: "#0B2E20",
          green: "#16794A",
          "green-deep": "#0F5F39",
          leaf: "#2FA36B",
          lime: "#B7EC6E",
          mist: "#EAF4EE",
        },
        ink: "#0E1B15",
        cream: "#F6F8F5",
        line: "#E3E9E4",
        muted: "#5C6B62",
      },
      fontFamily: {
        display: ["var(--font-serif)", "Georgia", "serif"],
        body: ["var(--font-sans)", "sans-serif"],
      },
      fontSize: {
        display: ["4.5rem", { lineHeight: "1.05", fontWeight: "800", letterSpacing: "-0.03em" }],
        "display-sm": ["3rem", { lineHeight: "1.1", fontWeight: "800", letterSpacing: "-0.02em" }],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(150deg, #0B2E20 0%, #14503A 55%, #0B2E20 100%)",
        "leaf-gradient": "linear-gradient(135deg, #2FA36B 0%, #16794A 100%)",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(14, 27, 21, 0.04), 0 6px 16px -6px rgba(14, 27, 21, 0.06)",
        "card-hover": "0 2px 4px rgba(14, 27, 21, 0.05), 0 16px 32px -12px rgba(14, 27, 21, 0.14)",
        leaf: "0 4px 20px rgba(22, 121, 74, 0.22)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      maxWidth: {
        container: "1280px",
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
export default config;
