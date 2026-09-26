import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/ui/PageHero";
import BiayaContent from "@/components/features/BiayaContent";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Biaya & Beasiswa",
  description:
    "Biaya dan beasiswa PPDB SMAN 68 Jakarta — sekolah negeri tanpa SPP, rincian kebutuhan, dan program bantuan siswa.",
  path: "/ppdb/biaya",
});

export default function BiayaPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem] min-h-screen bg-cream">
        <PageHero
          title="Biaya & Beasiswa"
          lead="Transparansi biaya pendidikan di SMAN 68 Jakarta — sekolah negeri, tanpa biaya pendaftaran maupun SPP bulanan."
        />
        <BiayaContent />
      </main>
      <Footer />
    </>
  );
}
