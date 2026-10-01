"use client";

import PageHero from "@/components/ui/PageHero";
import { schoolData } from "@/lib/school-data";
import { cn } from "@/lib/utils";
import {
  CARD_WIDTH,
  CardRow,
  CardSlot,
  FlatBranch,
  FlatLine,
  LevelHeader,
  PersonCard,
} from "@/components/features/struktur/parts";
import { Clock, Phone, Mail, MapPin } from "lucide-react";

type TuMember = { name: string; role: string; photo?: string };

/* ------------------------------------------------------------------ */
/* Data personel Tata Usaha SMA Negeri 68 Jakarta (2026/2027).         */
/* Desain bagan sama dengan halaman Struktur Organisasi Sekolah.       */
/* Yang belum punya foto tampil dengan monogram inisial.               */
/* ------------------------------------------------------------------ */

const PIMPINAN: TuMember = {
  name: "Tjahyani, M.Pd",
  role: "Kepala Sekolah",
  photo: "/assets/guru/kepsek-tjahyani.webp",
};

const KASUBAG: TuMember = {
  name: "Heri Budi Prasetya, S.Pd",
  role: "Kasubag Tata Usaha",
  photo: "/assets/guru/heri-budi-prasetya.webp",
};

/** Tingkat 3-10: urusan dan unit layanan, semuanya setara. */
const URUSAN_LAYANAN: TuMember[] = [
  { name: "Janatunisa", role: "Ketenagaan", photo: "/assets/guru/janatunsia.webp" },
  { name: "Liana Arisah", role: "Kesiswaan", photo: "/assets/guru/liana-arisah.webp" },
  { name: "Sony Riantori", role: "Persuratan & Arsip" },
  { name: "Joriman", role: "Keuangan", photo: "/assets/guru/joriman.webp" },
  { name: "Widodo", role: "Keuangan", photo: "/assets/guru/widodo.webp" },
  { name: "Desi Ratna S.M", role: "Inventaris", photo: "/assets/guru/desi-ratnasari.webp" },
  { name: "Ermantoro Agung S.", role: "Perpustakaan", photo: "/assets/guru/ermantoro-agung.webp" },
  { name: "Janatunisa", role: "Laboratorium", photo: "/assets/guru/janatunsia.webp" },
  { name: "Arif N.", role: "Keamanan", photo: "/assets/guru/arif-nurizki.webp" },
  { name: "Mastur", role: "Keamanan", photo: "/assets/guru/mastur.webp" },
  { name: "Surahman", role: "Keamanan", photo: "/assets/guru/surahman.webp" },
];

/** Tingkat 11-17: kebersihan per lantai, lingkungan, dan transportasi. */
const KEBERSIHAN: TuMember[] = [
  { name: "Mastur", role: "Kebersihan Lantai 1", photo: "/assets/guru/mastur.webp" },
  { name: "Wawan Sujani", role: "Kebersihan Lantai 2", photo: "/assets/guru/wawan-sujani.webp" },
  { name: "Wawan Sujani", role: "Kebersihan Lantai 3", photo: "/assets/guru/wawan-sujani.webp" },
  { name: "Andi Saepul Yusuf", role: "Kebersihan Lantai 3", photo: "/assets/guru/andi-saepul.webp" },
  { name: "Andi Saepul Yusuf", role: "Kebersihan Lantai 4", photo: "/assets/guru/andi-saepul.webp" },
  { name: "Surahman", role: "Kebersihan Lantai 5", photo: "/assets/guru/surahman.webp" },
  { name: "Surahman", role: "Kebersihan Halaman & Lingkungan", photo: "/assets/guru/surahman.webp" },
  { name: "Ermantoro Agung S.", role: "Transportasi", photo: "/assets/guru/ermantoro-agung.webp" },
];

/** Baris kartu personel; kunci unik karena satu orang bisa memegang >1 tugas. */
function PersonRow({ members }: { members: TuMember[] }) {
  return (
    <CardRow>
      {members.map((member) => (
        <CardSlot key={`${member.role}-${member.name}`}>
          <PersonCard name={member.name} role={member.role} photo={member.photo} />
        </CardSlot>
      ))}
    </CardRow>
  );
}

export default function StrukturTU() {
  return (
    <div className="min-h-screen bg-cream pb-20 sm:pb-24 font-body text-ink">
      <PageHero
        title={
          <>
            Struktur Organisasi <span className="text-brand-lime">Tata Usaha</span>
          </>
        }
        lead="Susunan petugas tata usaha SMA Negeri 68 Jakarta: kasubag, urusan, unit layanan, keamanan, kebersihan, dan transportasi."
      />

      <div className="container-custom pt-6 sm:pt-8">
        <div className="flex flex-col items-center">
          <section className="w-full max-w-5xl">
            <LevelHeader title="Pimpinan" />
            <FlatBranch count={1} />
            <div className={cn("mx-auto mt-2 sm:mt-3", CARD_WIDTH)}>
              <PersonCard {...PIMPINAN} />
            </div>
          </section>

          <FlatLine />

          <section className="w-full max-w-5xl">
            <LevelHeader title="Kasubag Tata Usaha" />
            <FlatBranch count={1} />
            <div className={cn("mx-auto mt-2 sm:mt-3", CARD_WIDTH)}>
              <PersonCard {...KASUBAG} />
            </div>
          </section>

          <FlatLine />

          <section className="w-full max-w-5xl">
            <LevelHeader title="Urusan & Unit Layanan" />
            <FlatBranch count={4} />
            <PersonRow members={URUSAN_LAYANAN} />
          </section>

          <FlatLine />

          <section className="w-full max-w-5xl">
            <LevelHeader title="Kebersihan, Lingkungan & Transportasi" />
            <FlatBranch count={4} />
            <PersonRow members={KEBERSIHAN} />
          </section>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-14 sm:mt-16 max-w-5xl mx-auto">
          <div className="card-static p-6">
            <h2 className="font-display font-bold text-xl text-ink mb-3 flex items-center gap-2">
              <Clock size={18} className="text-brand-green" /> Jam Layanan TU
            </h2>
            <div className="space-y-2 text-sm">
              {[
                ["Senin-Kamis", "07.30-15.00 WIB"],
                ["Jumat", "07.30-11.30 & 13.00-15.00 WIB"],
                ["Sabtu-Minggu / Libur", "Tutup (layanan darurat via email)"],
                ["Legalisir ijazah", "Khusus kelas 12, hanya saat dibuka admin via dashboard"],
                ["Mutasi", "Lihat syarat & jadwal di halaman Info Mutasi"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 pb-2 border-b border-line last:border-0">
                  <span className="text-muted">{k}</span>
                  <span className="font-semibold text-ink text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2.5 mt-4">
              <a href="/tentang/struktur-organisasi" className="btn-ghost min-h-[44px] px-4 text-xs">Struktur Sekolah →</a>
              <a href="/layanan/mutasi" className="btn-ghost min-h-[44px] px-4 text-xs">Info Mutasi →</a>
              <a href="/tentang/ppid" className="btn-ghost min-h-[44px] px-4 text-xs">Layanan PPID →</a>
              <a href="/dashboard" className="btn-ghost min-h-[44px] px-4 text-xs">Buka Dashboard →</a>
            </div>
          </div>
          <div className="card-static p-6">
            <h2 className="font-display font-bold text-xl text-ink mb-4">Kontak Tata Usaha</h2>
            <div className="space-y-3 text-sm">
              {[
                { icon: MapPin, label: "Ruang TU", value: "Gedung utama lantai 1, " + schoolData.kontak.alamat },
                { icon: Phone, label: "Telepon", value: schoolData.kontak.telepon },
                { icon: Mail, label: "Email", value: schoolData.kontak.email },
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
          </div>
        </div>

        <div className="mt-14 sm:mt-16 pt-6 border-t border-line text-center text-xs text-muted max-w-xl mx-auto space-y-1 px-4">
          <p className="font-semibold text-ink">Struktur Organisasi Tata Usaha SMA Negeri 68 Jakarta</p>
          <p>Layanan administrasi sekolah untuk siswa, orang tua, dan tamu.</p>
        </div>
      </div>
    </div>
  );
}
