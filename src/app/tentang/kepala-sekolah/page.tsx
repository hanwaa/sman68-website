import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import PageHero from "@/components/ui/PageHero";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kepala Sekolah",
  description:
    "Profil dan sambutan Kepala SMA Negeri 68 Jakarta — visi kepemimpinan dan komitmen mutu pendidikan.",
  path: "/tentang/kepala-sekolah",
});

export default function KepalaSekolah() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <PageHero
          title={
            <>
              Kepala <span className="text-brand-lime">Sekolah</span>
            </>
          }
          lead="Sambutan dan profil kepala SMA Negeri 68 Jakarta."
        />
        <section className="section-padding bg-cream">
          <div className="container-custom max-w-4xl">

            <div className="card p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="relative w-52 md:w-56 aspect-[4/5] rounded-xl overflow-hidden border border-line flex-shrink-0">
                  <Image
                    src="/assets/kepsek.png"
                    alt="Kepala SMAN 68 Jakarta"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 208px, 224px"
                  />
                </div>
                <div className="flex-1">
                  <span className="badge bg-brand-green/10 text-brand-green mb-3">Kepala Sekolah</span>
                  <h2 className="font-display font-extrabold text-2xl text-ink mb-1">Kepala SMAN 68 Jakarta</h2>
                  <p className="text-muted text-sm mb-6">SMA Negeri 68 Jakarta</p>

                  <div className="bg-brand-pine/5 border border-brand-pine/10 rounded-xl p-5 mb-6">
                    <p className="text-ink italic leading-relaxed">
                      &ldquo;SMAN 68 bukan hanya sekolah — ia adalah tempat di mana setiap potensi ditemukan,
                      dipupuk, dan diwujudkan menjadi dampak nyata bagi bangsa. Kami berkomitmen untuk
                      terus berinovasi dan memberikan pendidikan terbaik bagi generasi penerus.&rdquo;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      { label: "Status", value: "Aparatur Sipil Negara" },
                      { label: "Instansi", value: "Dinas Pendidikan DKI Jakarta" },
                      { label: "Jenjang", value: "SMA / Pendidikan Menengah" },
                      { label: "Akreditasi", value: "A (Skor 96)" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="text-muted text-xs">{item.label}</div>
                        <div className="font-semibold text-ink">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
