import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MutasiContent from "@/components/features/MutasiContent";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Info Mutasi Siswa",
  description:
    "Informasi mutasi siswa SMA Negeri 68 Jakarta, syarat pindah masuk & keluar, alur pengajuan, jadwal, kuota, dan kontak TU.",
  path: "/layanan/mutasi",
});

export default function MutasiPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <MutasiContent />
      </main>
      <Footer />
    </>
  );
}
