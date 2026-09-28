"use client";

import Image from "next/image";
import PageHero from "@/components/ui/PageHero";
import { schoolData } from "@/lib/school-data";
import { cn } from "@/lib/utils";

type Member = {
  name: string;
  role: string;
  photo: string;
  desc?: string;
};

// 1. Pimpinan Puncak
// Foto memakai aset lokal /assets/guru/ dengan spec 500x625 WebP yang sama
// seperti card lainnya. Nama memakai gelar Indonesia yang tepat untuk perempuan:
// "Drs." = doktor sarjana (S3), "Hj." = hajjah.
// Nama file diberi hash konten karena cache optimizer Next.js bertahan 30 hari
// (images.minimumCacheTTL) — ganti nama file = busted cache, foto baru langsung tampil.
const KEPALA_SEKOLAH: Member = {
  name: "Drs. Hj. Sri Wahyuni, M.Pd.",
  role: "Kepala Sekolah",
  photo: "/assets/guru/kepsek-a2f0c5c4.webp",
  desc: "Penanggung jawab umum manajerial, supervisi instruksional, tata kelola, dan mutu pendidikan SMAN 68 Jakarta.",
};

// 2. Wakil Kepala Sekolah (4 Pilar Manajemen)
const WAKASEK: Member[] = [
  {
    name: "Dra. Ratna Dewi, M.Hum.",
    role: "Wakasek Kurikulum",
    photo: "/assets/guru/ratna-dewi.webp",
    desc: "Pengembangan Kurikulum Merdeka, modul ajar, dan evaluasi hasil belajar siswa.",
  },
  {
    name: "Hendra Gunawan, M.Pd.",
    role: "Wakasek Kesiswaan",
    photo: "/assets/guru/hendra-gunawan.webp",
    desc: "Pembinaan karakter, OSIS/MPK, 26 ekstrakurikuler, dan prestasi lomba siswa.",
  },
  {
    name: "Budi Santoso, S.Pd.",
    role: "Wakasek Sarpras",
    photo: "/assets/guru/budi-santoso.webp",
    desc: "Pengelolaan 24 ruang kelas, 7 laboratorium terpadu, dan fasilitas lingkungan sekolah.",
  },
  {
    name: "Siti Rahayu, S.Pd., M.Si.",
    role: "Wakasek Humas",
    photo: "/assets/guru/siti-rahayu.webp",
    desc: "Kemitraan perguruan tinggi, dunia industri, jejaring alumni, dan layanan PPDB.",
  },
];

// 3. Koordinator Strategis & KTU (4 Kolom)
const KOORDINATOR: Member[] = [
  {
    name: "Suparman, S.E.",
    role: "Kepala Tata Usaha",
    photo: "/assets/guru/suparman.webp",
    desc: "Pengendalian urusan tata usaha, kepegawaian, surat-menyurat, dan keuangan sekolah.",
  },
  {
    name: "Dr. Wahyu Santoso",
    role: "Koord. Olimpiade & Riset",
    photo: "/assets/guru/wahyu-santoso.webp",
    desc: "Pembinaan peserta OSN, riset sains siswa, dan lomba karya ilmiah remaja.",
  },
  {
    name: "Eko Prasetyo, S.T.",
    role: "Koord. Digitalisasi & IT",
    photo: "/assets/guru/eko-prasetyo.webp",
    desc: "Infrastruktur server sekolah, Learning Management System, dan asesmen digital.",
  },
  {
    name: "Fajar Ramadhan, S.Pd.",
    role: "Koord. Disiplin & Karakter",
    photo: "/assets/guru/fajar-ramadhan.webp",
    desc: "Ketertiban harian, apel upacara, pembinaan pasukan Paskibra, dan kebugaran.",
  },
];

/** Flat Portrait Card: Responsif di mobile (grid-cols-2) dan desktop (grid-cols-4) */
function FlatPersonCard({
  name,
  role,
  photo,
  desc,
}: {
  name: string;
  role: string;
  photo: string;
  desc?: string;
}) {
  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-line bg-brand-pine shadow-xs transition-colors duration-200 ease-out hover:border-brand-leaf/60 hover:shadow-card">
      <Image
        src={photo}
        alt={name}
        fill
        className="object-cover object-top transition-transform duration-300 ease-out group-hover:scale-102"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-brand-pine via-brand-pine/50 to-transparent pointer-events-none" />

      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3.5 z-10 text-white">
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-brand-lime mb-0.5 line-clamp-1">
          {role}
        </div>
        <div className="font-display font-bold text-xs sm:text-base leading-tight sm:leading-snug text-white line-clamp-2">
          {name}
        </div>
        {desc && (
          <div className="text-[10px] sm:text-[11px] text-white/80 line-clamp-1 sm:line-clamp-2 mt-1 leading-snug font-normal">
            {desc}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Header level — rata tengah, tanpa ikon & tanpa nomor level.
 * Cukup judul yang diapit garis aksen tipis agar tetap terlihat terstruktur
 * tapi tetap tenang dan profesional.
 */
function LevelHeader({
  title,
  accentClass,
}: {
  title: string;
  /** Kelas Tailwind untuk garis aksen kiri/kanan. */
  accentClass: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3">
      <span
        className={cn("h-px w-8 shrink-0 sm:w-14", accentClass)}
        aria-hidden="true"
      />
      <h2 className="min-w-0 text-center font-display text-[12px] font-extrabold uppercase leading-tight tracking-[0.06em] text-ink sm:text-[14px] sm:tracking-[0.08em]">
        {title}
      </h2>
      <span
        className={cn("h-px w-8 shrink-0 sm:w-14", accentClass)}
        aria-hidden="true"
      />
    </div>
  );
}

/** Garis penghubung vertikal — lebih tebal & jelas. */
function FlatLine() {
  return (
    <div className="flex flex-col items-center my-4 sm:my-5" aria-hidden="true">
      <div className="w-[3px] rounded-full bg-brand-green/45 h-6 sm:h-7" />
      <div className="h-0 w-0 border-x-[5px] border-x-transparent border-t-[7px] border-t-brand-green/70 -mt-px" />
    </div>
  );
}

/** Percabangan -> panah tegas ke tiap kolom. count = 1 -> garis lurus. */
function FlatBranch({ count }: { count: number }) {
  const stem = "w-[3px] rounded-full bg-brand-green/45";
  const drop = "w-[3px] bg-brand-green/45";
  const head =
    "h-0 w-0 border-x-[5px] border-x-transparent border-t-[7px] border-t-brand-green/70 -mt-px";

  if (count < 2) {
    return (
      <div className="flex flex-col items-center my-3" aria-hidden="true">
        <div className={cn(stem, "h-5")} />
        <div className={head} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl my-3" aria-hidden="true">
      {/* Desktop: rel horizontal + turun panah di tiap kolom */}
      <div className="hidden lg:block">
        <div className={cn(stem, "mx-auto h-5")} />
        <div className="relative h-5">
          <div
            className="absolute top-0 h-[3px] rounded-full bg-brand-green/45"
            style={{
              left: `${100 / (count * 2)}%`,
              right: `${100 / (count * 2)}%`,
            }}
          />
          <div
            className="grid h-full"
            style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={cn(drop, "h-full")} />
                <div className={head} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile/tablet: garis lurus (grid 2 kolom jadi impractical) */}
      <div className="flex flex-col items-center lg:hidden">
        <div className={cn(stem, "h-4")} />
        <div className={head} />
      </div>
    </div>
  );
}

export default function GuruStaf() {
  const ptk = schoolData.ptk;

  return (
    <div className="min-h-screen bg-cream pb-20 sm:pb-24 font-body text-ink">
      {/* Page Hero */}
      <PageHero
        eyebrow="TATA KELOLA PENDIDIKAN"
        title={
          <>
            Pengurus Inti &amp; <span className="text-brand-lime">Pimpinan Sekolah</span>
          </>
        }
        lead="Hierarki kepemimpinan dan manajemen inti SMA Negeri 68 Jakarta: Kepala Sekolah, para Wakil Kepala Sekolah, Kepala Tata Usaha, dan Koordinator Strategis."
      />

      <div className="container-custom pt-6 sm:pt-8">
        {/* Ringkasan Statistik PTK (Mobile: 2x2, Desktop: 4 kolom) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-4xl mx-auto mb-6 sm:mb-8">
          {[
            { label: "Pendidik (Guru)", val: `${ptk.guru} Guru`, sub: "PNS & P3K Aktif" },
            { label: "Tenaga Kependidikan", val: `${ptk.totalPtk - ptk.guru} Staf`, sub: "TU, Lab & Perpus" },
            { label: "Kualifikasi S1/S2", val: `${ptk.persenKualifikasiS1}%`, sub: "Standar Akreditasi A" },
            { label: "Tersertifikasi", val: `${ptk.persenSertifikasi}%`, sub: "Pendidik Profesional" },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white border border-line rounded-xl p-3 sm:p-3.5 text-center shadow-card hover:border-brand-leaf/40 transition-colors"
            >
              <div className="font-display font-bold text-lg sm:text-xl text-brand-pine leading-tight">
                {item.val}
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-ink mt-1">{item.label}</div>
              <div className="text-[10px] sm:text-[11px] text-muted">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* ============================================================== */}
        {/* BAGAN PENGURUS INTI SEKOLAH                                    */}
        {/* ============================================================== */}

        <div className="flex flex-col items-center">
          {/* LEVEL 1: KEPALA SEKOLAH — lebarnya disamakan dengan satu kolom
              grid di bawahnya supaya semua card ukurannya konsisten. */}
          <section className="w-full max-w-5xl">
            <LevelHeader
              title="Pimpinan Puncak"
              accentClass="bg-brand-pine/30"
            />

            <FlatBranch count={1} />

            {/* Lebar kartu = tepat satu kolom grid, sama seperti card lain
                (2 kolom + gap-2.5 di HP, 2 kolom + gap-4 di tablet,
                4 kolom + gap-4 di desktop) supaya ukurannya konsisten. */}
            <div
              className={cn(
                "mx-auto mt-2 sm:mt-3",
                "w-[calc(50%-0.3125rem)] sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
              )}
            >
              <FlatPersonCard
                name={KEPALA_SEKOLAH.name}
                role={KEPALA_SEKOLAH.role}
                photo={KEPALA_SEKOLAH.photo}
                desc={KEPALA_SEKOLAH.desc}
              />
            </div>
          </section>

          {/* Garis Penghubung Level 1 -> 2 */}
          <FlatLine />

          {/* LEVEL 2: WAKIL KEPALA SEKOLAH (Mobile: 2x2 Grid, Desktop: 4 Kolom) */}
          <section className="w-full max-w-5xl">
            <LevelHeader
              title="Wakil Kepala Sekolah"
              accentClass="bg-brand-green/40"
            />

            <FlatBranch count={4} />

            {/* Grid 2 kolom di HP untuk kenyamanan scroll, 4 kolom di desktop */}
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:mt-3 sm:gap-4 lg:grid-cols-4">
              {WAKASEK.map((w, idx) => (
                <FlatPersonCard
                  key={idx}
                  name={w.name}
                  role={w.role}
                  photo={w.photo}
                  desc={w.desc}
                />
              ))}
            </div>
          </section>

          {/* Garis Penghubung Level 2 -> 3 */}
          <FlatLine />

          {/* LEVEL 3: TATA USAHA & KOORDINATOR STRATEGIS (Mobile: 2x2 Grid, Desktop: 4 Kolom) */}
          <section className="w-full max-w-5xl">
            <LevelHeader
              title="Kepala Tata Usaha & Koordinator Strategis"
              accentClass="bg-brand-leaf/40"
            />

            <FlatBranch count={4} />

            {/* Grid 2 kolom di HP untuk kenyamanan scroll, 4 kolom di desktop */}
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:mt-3 sm:gap-4 lg:grid-cols-4">
              {KOORDINATOR.map((k, idx) => (
                <FlatPersonCard
                  key={idx}
                  name={k.name}
                  role={k.role}
                  photo={k.photo}
                  desc={k.desc}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Footer Info */}
        <div className="mt-14 sm:mt-16 pt-6 border-t border-line text-center text-xs text-muted max-w-xl mx-auto space-y-1 px-4">
          <p className="font-semibold text-ink">
            Struktur Pengurus Inti Resmi SMA Negeri 68 Jakarta
          </p>
          <p>
            Data statistik tenaga pendidik dan kependidikan bersumber dari Dapodik Kemendikdasmen RI (NPSN 20100199).
          </p>
        </div>
      </div>
    </div>
  );
}
