"use client";

import PageHero from "@/components/ui/PageHero";
import { schoolData } from "@/lib/school-data";
import {
  ArrowLeftRight,
  LogIn,
  LogOut,
  FileCheck,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  CircleAlert,
} from "lucide-react";

const syaratMasuk = [
  "Surat permohonan mutasi dari orang tua/wali ditujukan ke Kepala SMAN 68 Jakarta.",
  "Surat keterangan pindah (mutasi) dari sekolah asal yang sudah ditandatangani kepala sekolah.",
  "Fotokopi rapor semester terakhir yang telah dilegalisir (minimal 2 semester).",
  "Fotokopi NISN, akta kelahiran, dan Kartu Keluarga (masing-masing 1 lembar).",
  "Surat keterangan bebas tunggakan administrasi dari sekolah asal.",
  "Pas foto 3x4 sebanyak 2 lembar.",
  "Menyatakan kesediaan mengikuti tes penempatan / wawancara bila diperlukan.",
];

const syaratKeluar = [
  "Surat permohonan pindah dari orang tua/wali dengan alasan yang jelas.",
  "Surat keterangan diterima dari sekolah tujuan (atau menyusul maksimal 14 hari).",
  "Menyelesaikan seluruh administrasi dan pengembalian buku/inventaris sekolah.",
  "Mengisi formulir pelepasan siswa di Tata Usaha dan mengambil surat pindah resmi.",
];

const alurMasuk = [
  "Konsultasi ketersediaan kuota ke TU (telepon/email) sebelum mengajukan.",
  "Serahkan berkas persyaratan ke TU pada jam layanan.",
  "Verifikasi berkas & peninjauan daya tampung rombel tujuan (maks. 36 siswa/rombel).",
  "Tes penempatan / wawancara (bila diminta) dan rapat pertimbangan.",
  "Penerbitan SK penerimaan mutasi + penempatan kelas oleh Kepala Sekolah.",
  "Registrasi Dapodik, pembuatan akun dashboard, dan orientasi siswa baru.",
];

const jadwal = [
  ["Semester gasal", "1 Juni - 31 Juli (penempatan awal tahun ajaran)"],
  ["Semester genap", "2 - 31 Januari (bila ada kursi kosong)"],
  ["Di luar periode", "Hanya untuk pindah domisili dinas / alasan khusus"],
  ["Pengumuman kuota", "Via papan TU & pengumuman dashboard setiap awal periode"],
];

const kontakRows: { icon: typeof MapPin; label: string; value: string; href?: string }[] = [
  { icon: MapPin, label: "Tata Usaha", value: schoolData.kontak.alamat },
  {
    icon: Phone,
    label: "Telepon",
    value: `${schoolData.kontak.telepon} (jam layanan TU)`,
    href: schoolData.kontak.teleponHref,
  },
  { icon: Mail, label: "Email", value: schoolData.kontak.email, href: schoolData.kontak.emailHref },
];

export default function MutasiContent() {
  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Informasi <span className="text-brand-lime">Mutasi Siswa</span>
          </>
        }
        lead="Ketentuan pindah masuk dan pindah keluar (mutasi) peserta didik SMA Negeri 68 Jakarta: syarat, alur, jadwal, dan kontak Tata Usaha."
      >
        <div className="flex flex-wrap gap-2.5">
          {["Kuota mengikuti daya tampung", "Gratis, tanpa pungutan", "Dapodik resmi"].map((b) => (
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

      <div className="container-custom py-12 space-y-10">
        <div className="card-static p-5 flex gap-3 border-brand-leaf/40">
          <CircleAlert size={18} className="text-brand-green flex-shrink-0 mt-0.5" />
          <p className="text-sm text-ink leading-relaxed">
            Mutasi hanya dapat diproses pada <strong>periode resmi</strong> dan selama{" "}
            <strong>daya tampung rombel tersedia</strong> (maks. 36 siswa per rombel, total 24 rombel).
            Pengajuan di luar periode hanya dipertimbangkan untuk pindah domisili karena tugas orang tua
            atau alasan khusus yang dapat dipertanggungjawabkan.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Navigasi cepat halaman ini">
          {[
            ["#syarat", "Syarat"],
            ["#alur", "Alur pengajuan"],
            ["#jadwal", "Jadwal & kuota"],
            ["#kontak", "Kontak"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="chip min-h-[44px] whitespace-nowrap font-semibold transition-[transform,border-color,background-color,color] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="grid lg:grid-cols-2 gap-6 scroll-mt-32" id="syarat">
          <div className="card-static p-6">
            <h2 className="font-display font-bold text-xl text-ink mb-3 flex items-center gap-2">
              <LogIn size={18} className="text-brand-green" /> Syarat Mutasi Masuk
            </h2>
            <ol className="space-y-2.5">
              {syaratMasuk.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-green text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-ink leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="card-static p-6">
            <h2 className="font-display font-bold text-xl text-ink mb-3 flex items-center gap-2">
              <LogOut size={18} className="text-brand-green" /> Syarat Pindah Keluar
            </h2>
            <ol className="space-y-2.5">
              {syaratKeluar.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-pine text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-ink leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 rounded-xl bg-cream p-4 text-xs text-muted leading-relaxed">
              Surat pindah resmi + transkrip nilai diterbitkan maksimal 7 hari kerja setelah berkas
              lengkap dan administrasi selesai.
            </div>
          </div>
        </div>

        <div className="card-static p-6 scroll-mt-32" id="alur">
          <h2 className="font-display font-bold text-xl text-ink mb-4 flex items-center gap-2">
            <FileCheck size={18} className="text-brand-green" /> Alur Pengajuan Mutasi Masuk
          </h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {alurMasuk.map((s, i) => (
              <li key={i} className="bg-cream rounded-xl p-4">
                <div className="text-[11px] font-bold text-brand-green mb-1">Langkah {i + 1}</div>
                <div className="text-sm text-ink leading-relaxed">{s}</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card-static p-6 scroll-mt-32" id="jadwal">
            <h2 className="font-display font-bold text-xl text-ink mb-3 flex items-center gap-2">
              <CalendarDays size={18} className="text-brand-green" /> Jadwal & Kuota
            </h2>
            <div className="space-y-2 text-sm">
              {jadwal.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 pb-2 border-b border-line last:border-0">
                  <span className="text-muted">{k}</span>
                  <span className="font-semibold text-ink text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card-static p-6 scroll-mt-32" id="kontak">
            <h2 className="font-display font-bold text-xl text-ink mb-4 flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-brand-green" /> Kontak & Pengajuan
            </h2>
            <div className="space-y-1 text-sm">
              {kontakRows.map(({ icon: Icon, label, value, href }) => {
                const row = (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-brand-green" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-xs text-muted">{label}</div>
                      <div className="font-medium text-ink text-sm">{value}</div>
                    </div>
                  </>
                );
                return href ? (
                  <a
                    key={label}
                    href={href}
                    className="flex min-h-[44px] items-center gap-3 -mx-2 px-2 rounded-lg transition-[transform,background-color] duration-150 hover:bg-cream active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
                  >
                    {row}
                  </a>
                ) : (
                  <div key={label} className="flex items-center gap-3 px-2 -mx-2">
                    {row}
                  </div>
                );
              })}
            </div>
            <a
              href={`mailto:${schoolData.kontak.email}?subject=${encodeURIComponent("Konsultasi Mutasi Siswa")}&body=${encodeURIComponent("Nama calon siswa:\nNISN:\nAsal sekolah:\nKelas yang dituju:\nAlasan mutasi:\nNo. HP orang tua:\n")}`}
              className="btn-primary btn-lg w-full mt-5"
            >
              <Mail size={16} /> Konsultasi via Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
