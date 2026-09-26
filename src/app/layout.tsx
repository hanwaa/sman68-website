import type { Metadata, Viewport } from "next";
import "./globals.css";
import FabWidget from "@/components/features/FabWidget";
import VisitorTracker from "@/components/features/VisitorTracker";
import JsonLd from "@/components/seo/JsonLd";
import { schoolSchema, websiteSchema } from "@/lib/schema";
import { DEFAULT_OG_IMAGE, SITE_NAME, siteBase } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteBase()),
  title: {
    template: "%s — SMAN 68 Jakarta",
    default: "SMAN 68 Jakarta",
  },
  description:
    "Situs resmi SMA Negeri 68 Jakarta — informasi akademik, prestasi, kegiatan, PPDB, dan komunitas sekolah.",
  keywords: ["SMAN 68 Jakarta", "SMA Negeri 68 Jakarta", "PPDB SMAN 68", "sekolah menengah atas Jakarta"],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description:
      "Situs resmi SMA Negeri 68 Jakarta untuk siswa, guru, orang tua, dan alumni.",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description:
      "Situs resmi SMA Negeri 68 Jakarta untuk siswa, guru, orang tua, dan alumni.",
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B2E20",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="antialiased font-body bg-cream text-ink">
        <a href="#main-content" className="skip-link">
          Lompat ke konten utama
        </a>
        <JsonLd data={[schoolSchema(), websiteSchema()]} />
        {children}
        <VisitorTracker />
        <FabWidget />
      </body>
    </html>
  );
}
