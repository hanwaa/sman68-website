import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AlumniNetwork from "@/components/features/AlumniNetwork";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Alumni",
  description: "Jaringan alumni SMAN 68 Jakarta, direktori, spotlight, dan komunitas lintas angkatan.",
  path: "/komunitas/alumni",
});

export default function AlumniPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <AlumniNetwork />
      </main>
      <Footer />
    </>
  );
}
