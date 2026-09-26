import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SchoolChronicle from "@/components/features/SchoolChronicle";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sejarah",
  description:
    "Sejarah SMA Negeri 68 Jakarta sejak 1967 — tonggak perkembangan, identitas, dan perjalanan sekolah.",
  path: "/tentang/sejarah",
});

export default function SejarahPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <SchoolChronicle />
      </main>
      <Footer />
    </>
  );
}
