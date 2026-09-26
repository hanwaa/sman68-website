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
        // Palet utama: cyan #00FFFF, kuning #FFFF00, merah #FF0000 — sesuai
        // warna logo SMAN 68. Nilai di bawah sudah diturunkan agar kontras
        // tetap lulus WCAG AA (lihat scripts/check-contrast notes):
        //   cyan   di pine #062A31 = 12.11:1
        //   kuning di pine #062A31 = 14.14:1
        //   putih  di pine #062A31 = 15.18:1
        brand: {
          pine: "#062A31", // permukaan gelap paling dalam
          green: "#0A5A66", // aksi utama (putah di atasnya 7.87:1)
          "green-deep": "#04424C",
          leaf: "#0B7688", // aksen (putah di atasnya 5.30:1)
          lime: "#FFFF00", // sekunder
          mist: "#E4F7FA",
        },
        // Tersier. #FF0000 dipakai untuk ikon, border, dan teks besar di
        // latar gelap (3.80:1). Untuk teks biasa dan latar yang membawa teks
        // putih pakai danger-deep (putah di atasnya 5.74:1); danger-tint untuk
        // kotak peringatan berlatar muda.
        danger: "#FF0000",
        "danger-deep": "#C81E1E",
        "danger-tint": "#FFE8E8",
        ink: "#05242B",
        cream: "#F4FAFB",
        line: "#CFE7EC",
        muted: "#4C6B75",
        // Permukaan solid (flat) pengganti warna transparan/glassmorphism.
        // Nilai = hasil pencampuran white di atas brand-pine, jadi hierarki
        // warnanya sama seperti versi transparan tetapi fully opaque.
        "surface-1": "#0D3A42",
        "surface-2": "#14454F",
        "surface-3": "#1B515C",
        "edge-1": "#14454F",
        "edge-2": "#2A6472",
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
        "hero-gradient": "linear-gradient(150deg, #062A31 0%, #0B5560 55%, #062A31 100%)",
        "leaf-gradient": "linear-gradient(135deg, #00E5F0 0%, #0A5A66 100%)",
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
