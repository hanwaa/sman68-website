import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StrukturOrganisasi from "@/components/features/StrukturOrganisasi";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Struktur Organisasi Sekolah",
  description:
    "Bagan struktur organisasi SMA Negeri 68 Jakarta, kepala sekolah, wakil kepala sekolah, koordinator, dan pelaksana.",
  path: "/tentang/struktur-organisasi",
});

export default function StrukturOrganisasiPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <StrukturOrganisasi />
      </main>
      <Footer />
    </>
  );
}
