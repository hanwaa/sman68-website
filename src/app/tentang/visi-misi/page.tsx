import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/ui/PageHero";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Visi & Misi",
  description:
    "Visi dan misi SMA Negeri 68 Jakarta — arah pendidikan, nilai sekolah, dan target capaian siswa.",
  path: "/tentang/visi-misi",
});

export default function VisiMisi() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <PageHero
          title={
            <>
              Visi &amp; <span className="text-brand-lime">Misi</span>
            </>
          }
          lead="Arah dan komitmen SMA Negeri 68 Jakarta dalam membentuk generasi berprestasi dan berkarakter."
        />
        <section className="section-padding bg-cream">
          <div className="container-custom max-w-3xl">

            <div className="card p-8 mb-6">
              <h2 className="font-display font-bold text-2xl text-ink mb-4 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center text-sm font-bold">V</span>
                Visi
              </h2>
              <p className="text-ink text-lg leading-relaxed font-medium italic">
                &ldquo;Mewujudkan insan yang bertaqwa, berprestasi, berkarakter, dan berwawasan global dalam lingkungan belajar yang menyenangkan.&rdquo;
              </p>
            </div>

            <div className="card p-8">
              <h2 className="font-display font-bold text-2xl text-ink mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center text-sm font-bold">M</span>
                Misi
              </h2>
              <ol className="space-y-4">
                {[
                  "Menyelenggarakan pendidikan yang berkualitas dan berakhlak mulia berlandaskan iman dan taqwa.",
                  "Meningkatkan prestasi akademik dan non-akademik melalui pembelajaran yang inovatif dan kreatif.",
                  "Membangun karakter siswa yang jujur, disiplin, bertanggung jawab, dan peduli lingkungan.",
                  "Mengembangkan potensi siswa melalui ekskul, organisasi, dan program pengembangan diri.",
                  "Menjalin kerjasama dengan berbagai pihak untuk memperluas wawasan dan kesempatan siswa.",
                  "Menciptakan lingkungan sekolah yang aman, bersih, indah, dan kondusif untuk belajar.",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-ink leading-relaxed">{item}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
