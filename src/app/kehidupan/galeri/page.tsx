import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GaleriPage from "@/components/features/GaleriView";
import JsonLd from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import { getGallery } from "@/lib/content-server";
import { breadcrumbSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Galeri",
  description: "Galeri foto kegiatan dan momen terbaik SMAN 68 Jakarta — akademik, ekskul, dan acara sekolah.",
  path: "/kehidupan/galeri",
});

export default async function Galeri() {
  const gallery = await getGallery();
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <JsonLd
          data={breadcrumbSchema([
            { name: "Beranda", path: "/" },
            { name: "Galeri", path: "/kehidupan/galeri" },
          ])}
        />
        <GaleriPage initialGallery={gallery} />
      </main>
      <Footer />
    </>
  );
}
