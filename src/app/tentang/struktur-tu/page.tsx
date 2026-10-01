import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StrukturTU from "@/components/features/StrukturTU";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Struktur Organisasi Tata Usaha",
  description:
    "Susunan petugas tata usaha SMA Negeri 68 Jakarta: kasubag, urusan, unit layanan, keamanan, kebersihan, dan transportasi.",
  path: "/tentang/struktur-tu",
});

export default function StrukturTuPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <StrukturTU />
      </main>
      <Footer />
    </>
  );
}
