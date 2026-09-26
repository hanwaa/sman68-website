import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FasilitasPage from "@/components/features/FasilitasMap";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Fasilitas",
  description: "Denah ruang dan fasilitas SMA Negeri 68 Jakarta berdasarkan data resmi Dapodik.",
  path: "/tentang/fasilitas",
});

export default function Fasilitas() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <FasilitasPage />
      </main>
      <Footer />
    </>
  );
}
