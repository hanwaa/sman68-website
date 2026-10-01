import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";
import PageHero from "@/components/ui/PageHero";
import ProgramStudi from "@/components/features/ProgramStudi";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Program Studi",
  description:
    "Program akademik dan peminatan SMA Negeri 68 Jakarta dengan Kurikulum Merdeka, mata pelajaran, layanan belajar, dan pembinaan siswa.",
  path: "/akademik/program",
});

export default function ProgramPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem] min-h-screen bg-cream">
        <PageHero
          title={
            <>
              Program <span className="text-brand-lime">Studi</span>
            </>
          }
          lead="Temukan program studi yang sesuai dengan minat dan bakat kamu di SMAN 68 Jakarta."
        />

        <div className="container-custom py-12">
          <ProgramStudi />
        </div>
      </main>
      <Footer />
    </>
  );
}
