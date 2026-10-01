import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SMA Negeri 68 Jakarta",
    short_name: "SMAN 68",
    description:
      "Situs resmi SMA Negeri 68 Jakarta, berita, prestasi, PPDB, dan informasi sekolah.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4FAFB",
    theme_color: "#062A31",
    icons: [
      { src: "/icon.png", sizes: "256x256", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
