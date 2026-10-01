"use client";

import PageHero from "@/components/ui/PageHero";
import { cn } from "@/lib/utils";
import {
  CARD_WIDTH,
  CardRow,
  CardSlot,
  FlatBranch,
  FlatLine,
  FlatPersonCard,
  LevelHeader,
  NameCard,
} from "@/components/features/struktur/parts";

type Member = { name: string; role: string; photo: string; desc?: string };

/* ------------------------------------------------------------------ */
/* Data struktur resmi SMA Negeri 68 Jakarta (2026/2027).              */
/* Urutan bagan: Kepala Sekolah, Komite & Kasubag TU, Tim Pengembang,  */
/* Wakil Kepala Sekolah (satu baris setara), lalu seluruh Staf.        */
/* ------------------------------------------------------------------ */

const KEPALA_SEKOLAH: Member = {
  name: "Tjahyani, M.Pd",
  role: "Kepala Sekolah",
  photo: "/assets/guru/kepsek-tjahyani.webp",
  desc: "Penanggung jawab umum manajerial, supervisi instruksional, tata kelola, dan mutu pendidikan SMAN 68 Jakarta.",
};

const KOMITE = { name: "Rahayu Adelina", role: "Komite Sekolah" };

const KASUBAG_TU: Member = {
  name: "Heri Budi Prasetya, S.Pd",
  role: "Kasubag Tata Usaha",
  photo: "/assets/guru/heri-budi-prasetya.webp",
  desc: "Administrasi umum, kepegawaian, keuangan, kearsipan, dan layanan tata usaha sekolah.",
};

const TIM_PENGEMBANG: Member[] = [
  { name: "Dr. Thurayah, M.Pd", role: "Tim Pengembang", photo: "/assets/guru/thurayah.webp" },
  { name: "Islamudina, S.Pd", role: "Koordinator Tim Pengembang", photo: "/assets/guru/islamudina.webp" },
  { name: "Rahma Hasan, M.Si", role: "Tim Pengembang", photo: "/assets/guru/rahma-hasan.webp" },
];

const WAKASEK: Member[] = [
  {
    name: "Marlina, M.Pd",
    role: "Wakasek Kurikulum",
    photo: "/assets/guru/marlina.webp",
    desc: "Pengembangan Kurikulum Merdeka, perangkat ajar, penilaian, dan evaluasi hasil belajar siswa.",
  },
  {
    name: "Iyan Maulana, M.Pd.I",
    role: "Wakasek Kesiswaan",
    photo: "/assets/guru/iyan-maulana.webp",
    desc: "Pembinaan karakter, OSIS/MPK, ekstrakurikuler, kedisiplinan, dan prestasi siswa.",
  },
  {
    name: "Indah Sulistio, M.Pd",
    role: "Wakasek Sarpras",
    photo: "/assets/guru/indah-sulistio.webp",
    desc: "Pengelolaan ruang kelas, laboratorium, dan fasilitas lingkungan sekolah.",
  },
];

const STAF: Member[] = [
  { name: "Daron Alfa Agustinus Rahardianto, S.Pd", role: "Staf Kurikulum", photo: "/assets/guru/daron.webp" },
  { name: "Ronald Indra Tjahjadi Sidik, S.T", role: "Staf Kurikulum", photo: "/assets/guru/ronald-indra.webp" },
  { name: "Trawati, M.Pd", role: "Staf Kurikulum", photo: "/assets/guru/trawati.webp" },
  { name: "Nurul Ihsiana, S.Pd", role: "Staf Kurikulum", photo: "/assets/guru/nurul-ihsiana.webp" },
  { name: "Aloysius Bayu Wirata, S.Pd", role: "Staf Kesiswaan", photo: "/assets/guru/bayu-wirata.webp" },
  { name: "Surya Rizjeki, S.Pd", role: "Staf Kesiswaan", photo: "/assets/guru/surya-rizjeki.webp" },
  { name: "Ronald Situmeang, S.Or", role: "Staf Kesiswaan", photo: "/assets/guru/ronald-situmeang.webp" },
  { name: "Jeniza Nur Arini, S.Pd", role: "Staf Kesiswaan", photo: "/assets/guru/jeniza.webp" },
  { name: "Sukma Erawan, S.Kom", role: "Staf Kesiswaan", photo: "/assets/guru/sukma-erawan.webp" },
  { name: "Romlah, S.Pd", role: "Staf Sarpras", photo: "/assets/guru/romlah.webp" },
  { name: "Wati Yunita, S.Pd", role: "Staf Sarpras", photo: "/assets/guru/wati-yunita.webp" },
];

const PELAKSANA = [
  { title: "Dewan Guru", desc: "Guru mata pelajaran, pelaksana pembelajaran, penilaian, dan pembimbingan siswa." },
  { title: "Bimbingan & Konseling", desc: "Layanan konseling individu/kelompok, peminatan studi lanjut, dan penanganan masalah siswa." },
  { title: "Wali Kelas (24 Rombel)", desc: "8 rombel per tingkat, pendampingan akademik, kedisiplinan, dan komunikasi orang tua." },
  { title: "OSIS / MPK", desc: "Organisasi siswa intra sekolah, pelaksana kegiatan kesiswaan dan aspirasi siswa." },
];

export default function StrukturOrganisasi() {
  return (
    <div className="min-h-screen bg-cream pb-20 sm:pb-24 font-body text-ink">
      <PageHero
        title={
          <>
            Struktur Organisasi <span className="text-brand-lime">Sekolah</span>
          </>
        }
        lead="Susunan pengurus inti SMA Negeri 68 Jakarta: kepala sekolah, komite, tim pengembang, wakil kepala sekolah beserta staf, dan tata usaha."
      />

      <div className="container-custom pt-6 sm:pt-8">
        <div className="flex flex-col items-center">
          <section className="w-full max-w-5xl">
            <LevelHeader title="Kepala Sekolah" />
            <FlatBranch count={1} />
            <div className={cn("mx-auto mt-2 sm:mt-3", CARD_WIDTH)}>
              <FlatPersonCard {...KEPALA_SEKOLAH} />
            </div>
          </section>

          <FlatLine />

          <section className="w-full max-w-5xl">
            <LevelHeader title="Komite Sekolah & Kasubag Tata Usaha" />
            <FlatBranch count={2} />
            <CardRow>
              <CardSlot>
                <NameCard name={KOMITE.name} role={KOMITE.role} />
              </CardSlot>
              <CardSlot>
                <FlatPersonCard {...KASUBAG_TU} />
              </CardSlot>
            </CardRow>
            <div className="mt-4 flex justify-center">
              <a
                href="/tentang/struktur-tu"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-brand-green/25 px-4 py-2.5 text-xs font-bold text-brand-green transition-[transform,background-color] duration-150 hover:border-brand-green/50 hover:bg-brand-green/5 active:scale-[0.98]"
              >
                Detail unit pelaksana di Struktur Organisasi Tata Usaha
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </section>

          <FlatLine />

          <section className="w-full max-w-5xl">
            <LevelHeader title="Tim Pengembang" />
            <FlatBranch count={3} />
            <CardRow>
              {TIM_PENGEMBANG.map((member) => (
                <CardSlot key={member.name}>
                  <FlatPersonCard {...member} />
                </CardSlot>
              ))}
            </CardRow>
          </section>

          <FlatLine />

          <section className="w-full max-w-5xl">
            <LevelHeader title="Wakil Kepala Sekolah" />
            <FlatBranch count={3} />
            <CardRow>
              {WAKASEK.map((member) => (
                <CardSlot key={member.name}>
                  <FlatPersonCard {...member} />
                </CardSlot>
              ))}
            </CardRow>
          </section>

          <FlatLine />

          <section className="w-full max-w-5xl">
            <LevelHeader title="Staf" />
            <FlatBranch count={4} />
            <CardRow>
              {STAF.map((member) => (
                <CardSlot key={member.name}>
                  <FlatPersonCard {...member} />
                </CardSlot>
              ))}
            </CardRow>
          </section>

          <FlatLine />

          <section className="w-full max-w-5xl">
            <LevelHeader title="Pelaksana & Organisasi Siswa" />
            <FlatBranch count={4} />
            <div className="mt-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PELAKSANA.map((p) => (
                <div key={p.title} className="bg-white border border-line rounded-xl p-4 shadow-card">
                  <div className="font-bold text-sm text-brand-pine mb-1">{p.title}</div>
                  <div className="text-xs text-muted leading-relaxed">{p.desc}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-14 sm:mt-16 pt-6 border-t border-line text-center text-xs text-muted max-w-xl mx-auto space-y-1 px-4">
          <p className="font-semibold text-ink">Struktur Organisasi Resmi SMA Negeri 68 Jakarta</p>
          <p>Data PTK bersumber dari Dapodik Kemendikdasmen RI (NPSN 20100199).</p>
        </div>
      </div>
    </div>
  );
}
