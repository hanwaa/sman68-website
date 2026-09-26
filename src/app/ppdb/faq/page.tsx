import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/ui/PageHero";
import FaqContent from "@/components/features/FaqContent";
import JsonLd from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import { getFaqs } from "@/lib/content-server";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "FAQ PPDB",
  description:
    "FAQ PPDB SMAN 68 Jakarta — jawaban pertanyaan umum tentang jadwal, syarat, alur pendaftaran, dan biaya sekolah.",
  path: "/ppdb/faq",
});

export default async function FaqPage() {
  const faqs = await getFaqs();
  const umum = faqs
    .filter((faq) => faq.category === "umum")
    .map((faq) => ({ question: faq.question, answer: faq.answer }));

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem] min-h-screen bg-cream">
        <JsonLd
          data={[
            faqSchema(umum),
            breadcrumbSchema([
              { name: "Beranda", path: "/" },
              { name: "PPDB", path: "/ppdb" },
              { name: "FAQ PPDB", path: "/ppdb/faq" },
            ]),
          ]}
        />
        <PageHero
          title="Pertanyaan Umum (FAQ)"
          lead="Jawaban atas pertanyaan yang paling sering ditanyakan calon siswa dan orang tua seputar PPDB SMAN 68 Jakarta."
        />
        <FaqContent />
      </main>
      <Footer />
    </>
  );
}
