import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EkskulPage from "@/components/features/EkskulList";
import JsonLd from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import { getEkskul } from "@/lib/content-server";
import { breadcrumbSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Ekskul & Organisasi",
  description: "26 ekskul dan organisasi aktif di SMAN 68 Jakarta — olahraga, seni, sains, dan kepemimpinan siswa.",
  path: "/kehidupan/ekskul",
});

export default async function Ekskul() {
  const ekskul = await getEkskul();
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <JsonLd
          data={breadcrumbSchema([
            { name: "Beranda", path: "/" },
            { name: "Ekskul & Organisasi", path: "/kehidupan/ekskul" },
          ])}
        />
        <EkskulPage initialEkskul={ekskul} />
      </main>
      <Footer />
    </>
  );
}
