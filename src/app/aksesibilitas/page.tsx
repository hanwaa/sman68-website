import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/ui/PageHero";
import { schoolData } from "@/lib/school-data";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Aksesibilitas",
  description:
    "Pernyataan aksesibilitas situs SMAN 68 Jakarta, panel aksesibilitas, standar WCAG 2.2 AA, navigasi keyboard, dan kanal bantuan pengguna.",
  path: "/aksesibilitas",
});

const FITUR_PANEL = [
  "Ukuran teks (normal, besar, sangat besar)",
  "Kontras tinggi, skala abu, dan mode bantu buta warna",
  "Kurangi gerak (menghentikan animasi dan putaran)",
  "Garis bawah pada tautan dan penanda fokus yang kuat",
  "Spasi huruf lebar, font bantu disleksia, dan target sentuh besar",
];

const FITUR_BAWAAN = [
  "Tautan “Lompat ke konten utama” dan navigasi penuh memakai keyboard.",
  "Jendela dialog menjebak fokus dan dapat ditutup dengan tombol Escape.",
  "Menghormati pengaturan sistem prefers-reduced-motion dan prefers-reduced-transparency.",
  "Kontras warna teks memenuhi ambang keterbacaan WCAG AA.",
  "Teks alternatif pada gambar bermakna dan struktur judul yang berurutan.",
  "Formulir berlabel dengan status yang terbaca pembaca layar.",
];

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
            <p className="text-xs">Terakhir diperbarui: 29 September 2026.</p>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">1. Standar yang Kami Acu</h2>
              <p>
                Situs SMAN 68 Jakarta berpedoman pada{" "}
                <strong className="text-ink">WCAG 2.2 level AA</strong> dan Undang-Undang
                Nomor 8 Tahun 2016 tentang Penyandang Disabilitas. Setiap masukan
                aksesibilitas yang masuk melalui kanal di bawah kami tindak lanjuti
                sebagai bagian dari pemeliharaan situs.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">2. Panel Aksesibilitas</h2>
              <p>
                Tombol aksesibilitas yang mengambang di setiap halaman membuka panel
                penyesuaian tampilan yang tersimpan di peramban Anda:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                {FITUR_PANEL.map((fitur) => (
                  <li key={fitur}>{fitur}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">3. Fitur Bawaan Situs</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                {FITUR_BAWAAN.map((fitur) => (
                  <li key={fitur}>{fitur}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">4. Kompatibilitas</h2>
              <p>
                Situs ini dirancang untuk peramban modern (Chrome, Edge, Firefox, Safari)
                versi terbaru beserta pembaca layarnya. Sebagian dokumen arsip atau tautan
                layanan pihak ketiga (misalnya formulir Google Drive) mengikuti standar
                aksesibilitas penyedianya masing-masing.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">5. Umpan Balik</h2>
              <p>
                Jika Anda menemukan hambatan akses pada situs ini, misalnya konten yang
                sulit dibaca, tidak bisa dijangkau keyboard, atau tidak terbaca pembaca
                layar, beri tahu kami melalui{" "}
                <a className="text-brand-green hover:underline" href={schoolData.kontak.emailHref}>
                  {schoolData.kontak.email}
                </a>{" "}
                atau telepon{" "}
                <a className="text-brand-green hover:underline" href={schoolData.kontak.teleponHref}>
                  {schoolData.kontak.telepon}
                </a>
                . Sertakan halaman yang bermasalah dan perangkat/peramban yang dipakai agar
                kami dapat menindaklanjutinya.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
