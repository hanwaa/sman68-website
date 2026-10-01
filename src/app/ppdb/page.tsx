import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PPDBGuide from "@/components/features/PPDBGuide";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "PPDB",
  description: "Panduan lengkap PPDB SMAN 68 Jakarta, jadwal, persyaratan, dan langkah pendaftaran.",
  path: "/ppdb",
});

export default function PPDBPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <PPDBGuide />
      </main>
      <Footer />
    </>
  );
}
