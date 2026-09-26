import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/ui/PageHero";
import { schoolData } from "@/lib/school-data";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi situs SMAN 68 Jakarta — data yang dikumpulkan, cara penggunaannya, dan hak pengguna atas informasi.",
  path: "/kebijakan-privasi",
});

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem] min-h-screen bg-cream">
        <PageHero
          title="Kebijakan Privasi"
          lead="Bagaimana SMAN 68 Jakarta mengelola data dan informasi pengguna situs ini."
        />
        <div className="container-custom max-w-3xl py-12">
          <div className="card p-8 space-y-6 text-sm text-muted leading-relaxed">
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">1. Informasi yang Kami Kumpulkan</h2>
              <p>
                Situs ini mengumpulkan informasi yang Anda berikan secara sukarela, seperti nama,
                alamat email, dan data pendaftaran (misalnya saat mengisi formulir PPDB atau
                akun demo). Kami juga mencatat data teknis anonim seperti jenis peramban dan
                statistik kunjungan untuk peningkatan layanan.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">2. Penggunaan Informasi</h2>
              <p>
                Data digunakan semata-mata untuk keperluan layanan sekolah: verifikasi pendaftaran,
                komunikasi resmi, dan administrasi kesiswaan. Kami tidak menjual atau membagikan
                data pribadi kepada pihak ketiga di luar keperluan hukum yang berlaku.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">3. Penyimpanan & Keamanan</h2>
              <p>
                Data disimpan pada infrastruktur yang dilindungi dan hanya dapat diakses oleh
                petugas yang berwenang. Kami menerapkan langkah pengamanan yang wajar untuk
                mencegah akses, pengungkapan, atau perubahan data tanpa izin.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">4. Hak Anda</h2>
              <p>
                Anda berhak meminta salinan data pribadi Anda, meminta perbaikan, atau penghapusan
                dengan menghubungi <a className="text-brand-green hover:underline" href={schoolData.kontak.emailHref}>{schoolData.kontak.email}</a>.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">5. Perubahan Kebijakan</h2>
              <p>
                Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan diumumkan
                melalui situs resmi sekolah.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
