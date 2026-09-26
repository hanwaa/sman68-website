import Link from "next/link";
import { schoolData } from "@/lib/school-data";
import PhotoBackdrop from "@/components/sections/PhotoBackdrop";

export default function AboutSection() {
  return (
    <section
      className="relative min-h-[70vh] md:min-h-screen flex items-center bg-brand-pine"
      aria-label="Tentang SMAN 68"
    >
      <PhotoBackdrop src="/assets/sekolah/sekolah-01-gedung.jpg" overlayClassName="bg-black/55" />

      <div className="container-custom relative py-24 md:py-32">
          <div className="max-w-2xl">
            <h2 className="font-display font-extrabold text-2xl md:text-4xl leading-snug text-white text-balance">
              &ldquo;SMAN 68 bukan hanya sekolah — tempat setiap potensi ditemukan,
              dipupuk, dan diwujudkan menjadi dampak nyata bagi bangsa.&rdquo;
            </h2>

            <p className="mt-6 text-white/80 text-base md:text-lg leading-relaxed">
              Sekolah negeri berakreditasi {schoolData.identitas.akreditasi} (Skor{" "}
              {schoolData.identitas.skorAkreditasi}) di Jakarta Pusat. Sejak{" "}
              {schoolData.identitas.tahunBerdiri}, kami menyiapkan lulusan untuk kampus
              terbaik dan dunia kerja — dengan karakter sebagai fondasi.
            </p>

            <div className="mt-8">
              <Link
                href="/tentang/profil"
                className="btn-accent"
              >
                Baca Lebih Lanjut
              </Link>
            </div>

            <div className="mt-10">
              <span className="block w-16 h-0.5 bg-brand-lime/80" aria-hidden="true" />
              <p className="mt-4 text-white font-semibold text-sm">Kepala SMAN 68 Jakarta</p>
              <p className="text-white/60 text-xs mt-0.5">SMA Negeri 68 Jakarta</p>
            </div>
          </div>
        </div>
    </section>
  );
}
