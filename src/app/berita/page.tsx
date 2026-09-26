import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BeritaList from "@/components/features/BeritaList";
import JsonLd from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import { getNews } from "@/lib/content-server";
import { breadcrumbSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Berita",
  description: "Berita terbaru dari SMAN 68 Jakarta — prestasi, kegiatan, dan pengumuman.",
  path: "/berita",
});

export default async function BeritaPage() {
  const articles = await getNews();
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <JsonLd
          data={breadcrumbSchema([
            { name: "Beranda", path: "/" },
            { name: "Berita", path: "/berita" },
          ])}
        />
        <BeritaList initialArticles={articles} />
      </main>
      <Footer />
    </>
  );
}
