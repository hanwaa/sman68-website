import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageHero from "@/components/ui/PageHero";
import { schoolData } from "@/lib/school-data";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi situs SMAN 68 Jakarta, data akun, akademik, dan teknis yang dikumpulkan, cara penggunaannya, serta hak pengguna.",
  path: "/kebijakan-privasi",
});

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem] min-h-screen bg-cream">
        <PageHero
          title="Kebijakan Privasi"
          lead="Bagaimana SMAN 68 Jakarta mengumpulkan, menggunakan, dan melindungi data pengguna situs ini."
        />
        <div className="container-custom max-w-3xl py-12">
          <div className="card p-8 space-y-6 text-sm text-muted leading-relaxed">
            <p className="text-xs">
              Terakhir diperbarui: 29 September 2026. Kebijakan ini mencakup situs publik
              SMAN 68 Jakarta beserta portal dashboard siswa, guru, dan admin di dalamnya.
            </p>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">1. Data yang Kami Kumpulkan</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-ink">Data akun:</strong> nomor induk (NISN siswa,
                  NIP guru, NPSN admin), nama, dan kata sandi yang disimpan dalam bentuk
                  hash satu arah (tidak ada kata sandi yang tersimpan sebagai teks biasa).
                </li>
                <li>
                  <strong className="text-ink">Data akademik:</strong> kehadiran dan foto
                  presensi, tugas dan nilai kelas digital, prestasi yang diajukan, serta
                  data pendaftaran PPDB bila Anda menggunakannya.
                </li>
                <li>
                  <strong className="text-ink">Data teknis anonim:</strong> jenis peramban dan
                  statistik kunjungan harian yang diagregat (tanpa identitas). Situs memakai
                  cookie sesi login, cookie pengunjung acak untuk statistik, dan penyimpanan
                  lokal peramban untuk preferensi aksesibilitas Anda.
                </li>
              </ul>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">2. Penggunaan Data</h2>
              <p>
                Data digunakan semata-mata untuk layanan pendidikan: autentikasi pengguna,
                administrasi kesiswaan dan kepegawaian, kegiatan belajar (absensi, tugas,
                nilai, pengumuman), serta peningkatan layanan situs. Kami tidak menjual data
                pribadi dan tidak membagikannya untuk pemasaran pihak ketiga.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">3. Penyimpanan & Keamanan</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Kata sandi di-hash dengan scrypt + salt unik per akun.</li>
                <li>
                  Sesi login memakai cookie yang hanya dikirim melalui koneksi aman (HTTPS)
                  dan kedaluwarsa otomatis; tersedia opsi &ldquo;keluar dari semua
                  perangkat&rdquo;.
                </li>
                <li>
                  Berkas (misalnya foto presensi) disimpan di penyimpanan objek terproteksi
                  dan situs disajikan melalui koneksi terenkripsi (TLS) dengan perlindungan
                  tepi Cloudflare.
                </li>
                <li>
                  Akses data dibatasi berdasarkan peran (siswa, guru/wali kelas, admin),
                  misalnya nilai dan pengumpulan tugas orang lain tidak dapat dilihat oleh
                  siswa lain.
                </li>
                <li>
                  Upaya login yang gagal berulang dibatasi sementara untuk mencegah
                  penyalahgunaan akun.
                </li>
              </ul>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">4. Pihak Ketiga</h2>
              <p>
                Dalam pengoperasiannya situs ini memakai layanan infrastruktur (jaringan
                pengiriman konten dan penyimpanan berkas) yang memproses data teknis
                secukupnya agar situs dapat berfungsi. Pengumpulan tugas memakai tautan
                Google Drive/Docs milik pengguna, yang tunduk pada kebijakan privasi
                masing-masing layanan tersebut. Selain itu, data pribadi tidak dibagikan
                kecuali diwajibkan peraturan perundang-undangan.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">5. Hak Anda</h2>
              <p>
                Anda berhak meminta salinan, perbaikan, atau penghapusan data pribadi Anda
                (sepanjang tidak bertentangan dengan kewajiban arsip sekolah), serta
                mencabut persetujuan untuk data yang diberikan secara sukarela. Hubungi
                Tata Usaha melalui{" "}
                <a className="text-brand-green hover:underline" href={schoolData.kontak.emailHref}>
                  {schoolData.kontak.email}
                </a>{" "}
                atau telepon{" "}
                <a className="text-brand-green hover:underline" href={schoolData.kontak.teleponHref}>
                  {schoolData.kontak.telepon}
                </a>
                . Untuk keamanan akun Anda sendiri: jangan bagikan kata sandi dan selalu
                keluar setelah memakai perangkat bersama.
              </p>
            </section>
            <section>
              <h2 className="font-display font-bold text-lg text-ink mb-2">6. Perubahan Kebijakan</h2>
              <p>
                Kebijakan ini dapat diperbarui mengikuti perkembangan layanan dan peraturan.
                Tanggal pembaruan selalu dicantumkan di atas; perubahan signifikan akan
                diumumkan melalui situs resmi sekolah.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
