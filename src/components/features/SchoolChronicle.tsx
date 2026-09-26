"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { Flag } from "lucide-react";
import PageHero from "@/components/ui/PageHero";

const milestones = [
  { year: "1967", title: "Lahirnya SMAN 68", desc: "SMA Negeri 68 Jakarta resmi didirikan dan mulai beroperasi dengan ratusan siswa angkatan pertama." },
  { year: "1972", title: "Gedung Baru", desc: "Pembangunan gedung permanen pertama sebagai wujud komitmen pemerintah terhadap pendidikan berkualitas." },
  { year: "1980", title: "1.000 Siswa", desc: "SMAN 68 mencapai tonggak bersejarah — jumlah siswa melampaui 1.000 orang untuk pertama kalinya." },
  { year: "1990", title: "Laboratorium Modern", desc: "Penambahan laboratorium IPA dan komputer pertama, menjadikan SMAN 68 sebagai pelopor teknologi pendidikan." },
  { year: "1995", title: "Akreditasi A Pertama", desc: "SMAN 68 meraih Akreditasi A dari Dinas Pendidikan DKI Jakarta untuk pertama kalinya." },
  { year: "2000", title: "Era Baru Milenium", desc: "Memasuki milenium baru dengan berbagai pembaruan kurikulum dan fasilitas yang semakin lengkap." },
  { year: "2005", title: "Sekolah Berprestasi Nasional", desc: "Meraih penghargaan Sekolah Berprestasi tingkat nasional dari Kementerian Pendidikan RI." },
  { year: "2010", title: "Olimpiade Sains", desc: "Pertama kali meraih medali emas di Olimpiade Sains Nasional — awal dari era dominasi akademik." },
  { year: "2015", title: "Digitalisasi Sekolah", desc: "Implementasi sistem informasi sekolah digital, menjadi pelopor transformasi digital pendidikan di Jakarta Pusat." },
  { year: "2019", title: "International Recognition", desc: "Tim sains SMAN 68 meraih penghargaan di International Science Fair untuk pertama kalinya." },
  { year: "2022", title: "Kurikulum Merdeka", desc: "SMAN 68 menjadi sekolah penggerak Kurikulum Merdeka — mengimplementasikan pembelajaran berbasis proyek." },
  { year: "2024", title: "Portal Digital Diluncurkan", desc: "Peluncuran portal digital terpadu SMAN 68 yang menghubungkan seluruh komunitas sekolah." },
];

export default function SchoolChronicle() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Perjalanan <span className="text-brand-lime">57 Tahun</span>
          </>
        }
        lead="Dari 1967 hingga hari ini — kisah panjang SMAN 68 Jakarta dalam membentuk generasi terbaik bangsa."
      />

      <div className="container-custom py-14" ref={containerRef}>
        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-line hidden md:block" />

          <div className="space-y-6">
            {milestones.map((m, i) => (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4 }}
                className={`relative flex items-center ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-green ring-4 ring-cream z-10 hidden md:block" />

                <div className={`w-full md:w-[calc(50%-2.5rem)] ${i % 2 === 0 ? "md:pr-8" : "md:pl-8"}`}>
                  <div className="card p-6">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-display font-extrabold text-2xl text-brand-green tabular-nums">
                        {m.year}
                      </span>
                      <span className="h-px flex-1 bg-line" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-ink mb-2">{m.title}</h2>
                    <p className="text-muted text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </div>

                <div className="hidden md:block md:w-[calc(50%-2.5rem)]" />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mt-12"
          >
            <div className="bg-brand-pine text-white px-8 py-6 rounded-xl text-center">
              <Flag size={22} className="text-brand-lime mx-auto mb-2" aria-hidden="true" />
              <div className="font-display font-extrabold text-lg">Terus Melangkah</div>
              <div className="text-xs text-white/60 font-medium mt-0.5">Perjalanan masih panjang</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
