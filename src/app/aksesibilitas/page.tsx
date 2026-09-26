import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/ui/PageHero";
import { schoolData } from "@/lib/school-data";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Aksesibilitas",
  description:
    "Pernyataan aksesibilitas situs SMAN 68 Jakarta — komitmen kemudahan akses, navigasi keyboard, dan kanal bantuan pengguna.",
  path: "/aksesibilitas",
});

export default function AccessibilityPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem] min-h-screen bg-cream">
        <PageHero
          title="Pernyataan Aksesibilitas"
          lead="Komitmen kami agar situs ini dapat digunakan oleh semua orang, termasuk penyandang disabilitas."
        />
        <div className="container-custom max-w-3xl py-12">
          <div className="card p-8 space-y-6 text-sm text-muted leading-relaxed">
            <p>
              Situs SMAN 68 Jakarta berupaya memenuhi standar <strong className="text-ink">WCAG 2.2 level AA</strong>,
              antara lain melalui:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Navigasi penuh menggunakan keyboard, termasuk tautan &ldquo;Lompat ke konten utama&rdquo;.</li>
              <li>Kontras warna yang memenuhi ambang keterbacaan teks.</li>
              <li>Teks alternatif pada seluruh gambar bermakna.</li>
              <li>Struktur judul (heading) yang berurutan dan logis.</li>
              <li>Dukungan <em>prefers-reduced-motion</em> untuk mematikan animasi.</li>
              <li>Formulir dengan label, status, dan pesan yang terbaca pembaca layar.</li>
            </ul>
            <p>
              Jika Anda menemukan hambatan akses pada situs ini, beri tahu kami melalui{" "}
              <a className="text-brand-green hover:underline" href={schoolData.kontak.emailHref}>
                {schoolData.kontak.email}
              </a>{" "}
              atau telepon{" "}
              <a className="text-brand-green hover:underline" href={schoolData.kontak.teleponHref}>
                {schoolData.kontak.telepon}
              </a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
