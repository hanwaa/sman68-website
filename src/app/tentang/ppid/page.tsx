import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PpidContent from "@/components/features/PpidContent";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "PPID",
  description:
    "PPID SMA Negeri 68 Jakarta: DIP, alur permohonan informasi publik, jenis informasi, dan kontak layanan.",
  path: "/tentang/ppid",
});

export default function PpidPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <PpidContent />
      </main>
      <Footer />
    </>
  );
}
