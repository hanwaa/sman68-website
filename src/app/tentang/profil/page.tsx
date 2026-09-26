import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProfilSekolah from "@/components/features/ProfilSekolah";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Profil Sekolah",
  description: "Profil lengkap SMA Negeri 68 Jakarta — sejarah, visi misi, akreditasi, dan prestasi.",
  path: "/tentang/profil",
});

export default function ProfilPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <ProfilSekolah />
      </main>
      <Footer />
    </>
  );
}
