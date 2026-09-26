import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GuruStafPage from "@/components/features/GuruStaf";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Guru & Staf",
  description: "Direktori guru dan staf SMA Negeri 68 Jakarta — bidang ajar, jabatan, dan kontak.",
  path: "/tentang/guru-staf",
});

export default function GuruStaf() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <GuruStafPage />
      </main>
      <Footer />
    </>
  );
}
