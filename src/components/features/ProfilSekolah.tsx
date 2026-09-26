"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Award,
  Users,
  BookOpen,
  Calendar,
  FlaskConical,
  Ruler,
  Globe,
  ExternalLink,
} from "lucide-react";
import { schoolData } from "@/lib/school-data";

const milestones = [
  { year: "1967", title: "Berdiri", desc: "SMAN 68 Jakarta didirikan sebagai salah satu SMA Negeri di Jakarta Pusat." },
  { year: "1980", title: "Berkembang", desc: "Penambahan gedung dan laboratorium. Jumlah siswa mencapai 1.000 orang." },
  { year: "1995", title: "Akreditasi A", desc: "Pertama kali meraih Akreditasi A dari Dinas Pendidikan DKI Jakarta." },
  { year: "2005", title: "Sekolah Berprestasi", desc: "Meraih penghargaan Sekolah Berprestasi tingkat nasional." },
  { year: "2015", title: "Digitalisasi", desc: "Implementasi sistem informasi sekolah digital pertama di Jakarta Pusat." },
  { year: "2024", title: "Portal Digital", desc: "Peluncuran portal digital terpadu sebagai sarana informasi dan komunikasi sekolah." },
];

const stats = [
  { icon: Users, value: String(schoolData.siswa.total), label: "Siswa Aktif" },
  { icon: BookOpen, value: String(schoolData.ptk.totalPtk), label: "Guru & Staf" },
  { icon: Award, value: "850+", label: "Prestasi" },
  {
    icon: Calendar,
    value: String(new Date().getFullYear() - schoolData.identitas.tahunBerdiri),
    label: "Tahun Berkarya",
  },
];

const dataResmi = [
  {
    icon: Users,
    title: "Peserta Didik",
    items: [
      `${schoolData.siswa.total} siswa (${schoolData.siswa.lakiLaki} laki-laki · ${schoolData.siswa.perempuan} perempuan)`,
      `${schoolData.siswa.rombel} rombongan belajar (${schoolData.siswa.rombelPerTingkat} per tingkat)`,
      `Rasio ${schoolData.siswa.rasioPerRombel} siswa per rombel`,
      `Rasio ${schoolData.siswa.rasioPerGuru} siswa per guru`,
    ],
  },
  {
    icon: BookOpen,
    title: "Guru & Tenaga Kependidikan",
    items: [
      `${schoolData.ptk.guru} guru (${schoolData.ptk.guruLakiLaki} laki-laki · ${schoolData.ptk.guruPerempuan} perempuan)`,
      `${schoolData.ptk.totalPtk} total guru & tenaga kependidikan`,
      `${schoolData.ptk.persenSertifikasi}% guru tersertifikasi`,
      `${schoolData.ptk.persenASN}% guru berstatus ASN`,
    ],
  },
  {
    icon: FlaskConical,
    title: "Sarana & Prasarana",
    items: [
      `${schoolData.sarana.ruangKelas} ruang kelas — ${schoolData.sarana.ruangKelasLayak}% layak`,
      `Laboratorium IPA (fisika, kimia, biologi), lab bahasa, lab IPS, dan lab komputer`,
      `${schoolData.sarana.perpustakaan} perpustakaan`,
      `Internet ${schoolData.sarana.internet}`,
    ],
  },
  {
    icon: Ruler,
    title: "Lahan & Utilitas",
    items: [
      `Luas tanah ${schoolData.sarana.luasTanahM2.toLocaleString("id-ID")} m²`,
      `Daya listrik ${schoolData.sarana.dayaListrikVA.toLocaleString("id-ID")} VA (${schoolData.sarana.sumberListrik})`,
      `Sumber air: ${schoolData.sarana.sumberAir}`,
      `Penyelenggaraan ${schoolData.identitas.penyelenggaraan}`,
    ],
  },
];

export default function ProfilSekolah() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="relative bg-brand-pine py-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/assets/sekolah/sekolah-01-gedung.jpg" alt="SMAN 68" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-pine via-brand-pine/90 to-brand-pine/70" />
        </div>
        <div className="container-custom relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16">
                <Image src="/assets/logo.png" alt="Logo SMAN 68" fill className="object-contain" />
              </div>
              <div>
                <div className="text-white/60 text-sm">SMA Negeri</div>
                <div className="font-display font-extrabold text-3xl text-white">68 Jakarta</div>
              </div>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-4">
              Profil <span className="text-brand-lime">Sekolah</span>
            </h1>
            <p className="text-white/70 text-lg max-w-2xl">
              Mengenal lebih dalam SMA Negeri 68 Jakarta — sejarah, identitas, dan komitmen kami terhadap pendidikan berkualitas.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-5 text-center">
                <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center mx-auto mb-3">
                  <Icon size={18} className="text-brand-green" />
                </div>
                <div className="font-display font-extrabold text-2xl text-ink">{stat.value}</div>
                <div className="text-xs text-muted mt-0.5">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-display font-extrabold text-2xl text-ink mb-4">Identitas Sekolah</h2>
            <div className="card p-6 space-y-4">
              {[
                ["Nama Resmi", schoolData.identitas.namaBersih],
                ["NPSN", schoolData.identitas.npsn],
                [
                  "Akreditasi",
                  `${schoolData.identitas.akreditasi} — Skor ${schoolData.identitas.skorAkreditasi} (${schoolData.identitas.skAkreditasi})`,
                ],
                ["Status", schoolData.identitas.status],
                ["Jenjang", "SMA (Sekolah Menengah Atas)"],
                ["Kurikulum", schoolData.identitas.kurikulum],
                ["Jumlah Rombel", `${schoolData.siswa.rombel} Rombongan Belajar`],
                ["Tahun Berdiri", String(schoolData.identitas.tahunBerdiri)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 pb-4 border-b border-line last:border-0 last:pb-0">
                  <span className="text-sm text-muted">{label}</span>
                  <span className="text-sm font-semibold text-ink text-right">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="font-display font-extrabold text-2xl text-ink mb-4">Kontak & Lokasi</h2>
            <div className="card p-6 space-y-4 mb-4">
              {[
                { icon: MapPin, label: "Alamat", value: schoolData.kontak.alamat },
                { icon: Phone, label: "Telepon", value: schoolData.kontak.telepon },
                { icon: Mail, label: "Email", value: schoolData.kontak.email },
                { icon: Globe, label: "Website", value: "sman68jkt.sch.id" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-brand-green" />
                  </div>
                  <div>
                    <div className="text-xs text-muted">{label}</div>
                    <div className="text-sm font-medium text-ink">{value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card overflow-hidden">
              <div className="bg-brand-pine/10 h-48 flex items-center justify-center text-muted text-sm">
                <div className="text-center">
                  <MapPin size={32} className="mx-auto mb-2 text-brand-green" />
                  <span>Peta Interaktif</span>
                  <br />
                  <a href={schoolData.kontak.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-brand-green text-xs hover:underline mt-1 block">
                    Buka di Google Maps →
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-ink">Data Resmi Sekolah</h2>
              <p className="text-muted text-sm mt-1">
                Statistik peserta didik, guru, dan sarana berdasarkan data Dapodik Kemendikdasmen.
              </p>
            </div>
            <a
              href={schoolData.sumber.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:underline flex-shrink-0"
            >
              Sumber: Sekolah Kita (Kemendikdasmen)
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dataResmi.map((blok) => {
              const Icon = blok.icon;
              return (
                <div key={blok.title} className="card p-5">
                  <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center mb-3">
                    <Icon size={18} className="text-brand-green" aria-hidden="true" />
                  </div>
                  <h3 className="font-display font-bold text-ink text-sm mb-2.5">{blok.title}</h3>
                  <ul className="space-y-1.5">
                    {blok.items.map((item) => (
                      <li key={item} className="text-xs text-muted leading-relaxed flex gap-1.5">
                        <span className="text-brand-leaf mt-0.5" aria-hidden="true">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="mt-4 card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-brand-green" aria-hidden="true" />
              <h3 className="font-display font-bold text-ink text-sm">Riwayat Akreditasi</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {schoolData.akreditasiRiwayat.map((a) => (
                <div
                  key={a.tahun}
                  className="flex items-center justify-between gap-3 bg-cream rounded-xl px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-muted">Tahun {a.tahun}</div>
                    <div className="text-[11px] text-muted mt-0.5 truncate">SK {a.sk}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-display font-extrabold text-brand-green">
                      {schoolData.identitas.akreditasi}
                    </div>
                    <div className="text-[11px] text-muted">Skor {a.skor}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="font-display font-extrabold text-2xl text-ink mb-6">Perjalanan SMAN 68</h2>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-green via-brand-leaf to-brand-leaf" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex items-start gap-6 md:gap-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-brand-leaf border-2 border-white shadow z-10" />
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                    <div className="card p-4">
                      <div className="font-display font-extrabold text-brand-leaf text-lg">{m.year}</div>
                      <div className="font-bold text-ink">{m.title}</div>
                      <div className="text-sm text-muted mt-1">{m.desc}</div>
                    </div>
                  </div>
                  <div className="hidden md:block md:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
