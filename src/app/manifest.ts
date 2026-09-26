import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SMA Negeri 68 Jakarta",
    short_name: "SMAN 68",
    description:
      "Situs resmi SMA Negeri 68 Jakarta — berita, prestasi, PPDB, dan informasi sekolah.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F8F5",
    theme_color: "#0B2E20",
    icons: [
      { src: "/icon.png", sizes: "any", type: "image/png" },
      { src: "/apple-icon.png", sizes: "any", type: "image/png" },
    ],
  };
}
