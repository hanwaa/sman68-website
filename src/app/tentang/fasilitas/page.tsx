import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Fasilitas",
  description: "Denah ruang dan fasilitas SMA Negeri 68 Jakarta berdasarkan data resmi Dapodik.",
  path: "/tentang/fasilitas",
});

// Peta/denah berat: split ke chunk dinamis agar tidak membebani first paint.
const FasilitasPage = dynamic(() => import("@/components/features/FasilitasMap"), {
  loading: () => (
    <div className="container-custom py-16" aria-busy="true">
      <div className="h-8 w-56 rounded bg-black/10 animate-pulse" />
      <div className="mt-4 h-96 rounded-2xl bg-black/5 animate-pulse" />
    </div>
  ),
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
