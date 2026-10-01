"use client";

import PageHero from "@/components/ui/PageHero";
import { schoolData } from "@/lib/school-data";
import {
  FileText,
  Clock,
  BadgeCheck,
  Archive,
  BellRing,
  FolderOpen,
  Lock,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
} from "lucide-react";

const jenisInformasi = [
  {
    icon: BadgeCheck,
    title: "Informasi Berkala",
    desc: "Wajib diumumkan secara rutin: profil sekolah, program kerja, laporan keuangan, PPDB, dan prestasi.",
  },
  {
    icon: BellRing,
    title: "Informasi Serta Merta",
    desc: "Diumumkan secepatnya saat ada kejadian luar biasa: bencana, kedaruratan, atau gangguan layanan.",
  },
  {
    icon: FolderOpen,
    title: "Informasi Setiap Saat",
    desc: "Tersedia kapan pun diminta: DIP, peraturan, surat keputusan, dan data yang tidak dikecualikan.",
  },
  {
    icon: Lock,
    title: "Informasi Dikecualikan",
    desc: "Tidak dapat diakses publik: data pribadi siswa, soal ujian, dan dokumen rahasia negara.",
  },
];

const alur = [
  "Pemohon mengisi formulir permohonan (langsung ke TU atau via email) dengan fotokopi identitas yang jelas.",
  "Petugas mencatat di buku registrasi dan memberi tanda terima maksimal 1 hari kerja.",
  "PPID memeriksa kelengkapan dan jenis informasi (maksimal 3 hari kerja).",
  "Pemberitahuan tertulis diberikan maksimal 10 hari kerja, dapat diperpanjang 7 hari kerja bila diperlukan.",
  "Pemohon yang keberatan dapat mengajukan keberatan ke Atasan PPID maksimal 30 hari kerja, lalu ke Komisi Informasi bila belum puas.",
];

const dip = [
  { no: "01", judul: "Profil Sekolah, visi-misi, dan struktur organisasi", wali: "PPID / TU" },
  { no: "02", judul: "Program kerja tahunan & laporan kegiatan sekolah", wali: "Wakasek Kurikulum" },
  { no: "03", judul: "Laporan keuangan BOS / BOP dan APBS", wali: "Bendahara / TU" },
  { no: "04", judul: "Data peserta didik, PTK, dan sarana prasarana", wali: "Dapodik / TU" },
  { no: "05", judul: "Informasi PPDB: daya tampung, seleksi, dan hasil", wali: "Panitia PPDB" },
  { no: "06", judul: "Prestasi akademik & non-akademik siswa", wali: "Wakasek Kesiswaan" },
];

export default function PpidContent() {
  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            PPID: Pejabat Pengelola <span className="text-brand-lime">Informasi & Dokumentasi</span>
          </>
        }
        lead="Layanan keterbukaan informasi publik SMA Negeri 68 Jakarta sesuai UU No. 14 Tahun 2008 tentang Keterbukaan Informasi Publik."
      >
        <div className="flex flex-wrap gap-2.5">
          {["SK PPID Sekolah", "DIP Terbarui", "Respons ≤ 10 Hari Kerja"].map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-xs font-semibold text-white/85"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" aria-hidden="true" />
              {b}
            </span>
          ))}
        </div>
      </PageHero>

      <div className="container-custom py-12 space-y-12">
        {/* Profil + dasar hukum */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-display font-bold text-xl text-ink mb-3 flex items-center gap-2">
              <FileText size={18} className="text-brand-green" /> Profil PPID
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              PPID SMA Negeri 68 Jakarta adalah pejabat yang bertanggung jawab atas pengumpulan,
              pendokumentasian, penyimpanan, dan pelayanan informasi publik di lingkungan sekolah.
              Setiap warga negara berhak memperoleh informasi publik sesuai ketentuan
              perundang-undangan.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              {[
                ["Alamat layanan", schoolData.kontak.alamat],
                ["Telepon", schoolData.kontak.telepon],
                ["Email PPID", schoolData.kontak.email],
                ["Jam layanan", "Senin-Jumat, 08.00-14.00 WIB (hari efektif sekolah)"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 pb-2 border-b border-line last:border-0">
                  <span className="text-muted">{k}</span>
                  <span className="font-semibold text-ink text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="font-display font-bold text-xl text-ink mb-3 flex items-center gap-2">
              <ClipboardList size={18} className="text-brand-green" /> Dasar Hukum
            </h2>
            <ul className="space-y-2.5 text-sm text-muted leading-relaxed">
              {[
                "UU No. 14 Tahun 2008 tentang Keterbukaan Informasi Publik.",
                "UU No. 25 Tahun 2009 tentang Pelayanan Publik.",
                "Peraturan Komisi Informasi No. 1 Tahun 2021 tentang Standar Layanan Informasi Publik.",
                "Permendikbud No. 75 Tahun 2016 tentang Komite Sekolah (untuk informasi keuangan).",
                "SK Kepala Sekolah tentang Penetapan PPID SMA Negeri 68 Jakarta.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-brand-leaf mt-0.5" aria-hidden="true">•</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Jenis informasi */}
        <section>
          <h2 className="font-display font-extrabold text-2xl text-ink mb-5">Jenis Informasi Publik</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {jenisInformasi.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-5">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-brand-green" />
                </div>
                <h3 className="font-bold text-ink text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DIP */}
        <section className="card p-6">
          <h2 className="font-display font-bold text-xl text-ink mb-1 flex items-center gap-2">
            <Archive size={18} className="text-brand-green" /> Daftar Informasi Publik (DIP)
          </h2>
          <p className="text-xs text-muted mb-4">Ringkasan dokumen yang tersedia dan dapat diminta oleh publik.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-line">
                  <th className="py-2 pr-4 font-semibold">No</th>
                  <th className="py-2 pr-4 font-semibold">Judul Informasi</th>
                  <th className="py-2 font-semibold">Wali Data</th>
                </tr>
              </thead>
              <tbody>
                {dip.map((r) => (
                  <tr key={r.no} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-4 text-muted">{r.no}</td>
                    <td className="py-2.5 pr-4 text-ink font-medium">{r.judul}</td>
                    <td className="py-2.5 text-muted text-xs">{r.wali}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Alur + kontak */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-display font-bold text-xl text-ink mb-4 flex items-center gap-2">
              <Clock size={18} className="text-brand-green" /> Alur Permohonan Informasi
            </h2>
            <ol className="space-y-3">
              {alur.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-ink leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted mt-4">
              Biaya penyalinan ditanggung pemohon sesuai ketentuan. Informasi dalam bentuk digital
              (PDF) tidak dipungut biaya.
            </p>
          </div>
          <div className="card p-6">
            <h2 className="font-display font-bold text-xl text-ink mb-4">Ajukan Permohonan</h2>
            <div className="space-y-3 text-sm">
              {[
                { icon: MapPin, label: "Datang langsung", value: "Ruang Tata Usaha, " + schoolData.kontak.alamat },
                { icon: Phone, label: "Telepon", value: schoolData.kontak.telepon + " (jam layanan)" },
                { icon: Mail, label: "Email", value: schoolData.kontak.email + ", subjek: Permohonan Informasi" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-brand-green" />
                  </div>
                  <div>
                    <div className="text-xs text-muted">{label}</div>
                    <div className="font-medium text-ink text-sm">{value}</div>
                  </div>
                </div>
              ))}
            </div>
            <a
              href={`mailto:${schoolData.kontak.email}?subject=${encodeURIComponent("Permohonan Informasi Publik, PPID SMAN 68")}&body=${encodeURIComponent("Nama:\nNIK/No. Identitas:\nAlamat:\nNo. HP:\nRincian informasi yang diminta:\nTujuan penggunaan:\n\n(Cantumkan fotokopi identitas sebagai lampiran)")}`}
              className="btn-primary btn-lg w-full mt-5"
            >
              <Mail size={16} /> Ajukan via Email
            </a>
            <p className="text-[11px] text-muted mt-3 leading-relaxed">
              Sertakan identitas diri yang sah dan rincian informasi yang diminta secara jelas agar
              permohonan dapat diproses cepat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
