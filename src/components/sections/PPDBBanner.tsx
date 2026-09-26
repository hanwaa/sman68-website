"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, Timer, FileCheck, Wallet, ChevronRight } from "lucide-react";
import PhotoBackdrop from "@/components/sections/PhotoBackdrop";

const PPDB_DATE = new Date("2025-06-03T07:00:00+07:00");

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [target]);

  return { timeLeft, mounted };
}

function CountdownBox({ value, label, mounted }: { value: number; label: string; mounted: boolean }) {
  return (
    <div className="text-center">
      <div
        className="font-display font-extrabold text-3xl md:text-4xl text-white leading-none tabular-nums"
        suppressHydrationWarning
      >
        {mounted ? String(value).padStart(2, "0") : "00"}
      </div>
      <div className="text-white/45 text-[10px] uppercase tracking-wider mt-2">{label}</div>
    </div>
  );
}

const steps = [
  {
    icon: FileCheck,
    title: "Kumpulkan Berkas, Santai Saja",
    desc: "Daftar centang dokumen sudah kami siapkan — tidak ada yang terlewat.",
  },
  {
    icon: ExternalLink,
    title: "Daftar dari Rumah",
    desc: "Lima langkah simpel di portal resmi; panitia siap membantu lewat chat.",
  },
  {
    icon: Wallet,
    title: "Tunggu Kabar & Daftar Ulang",
    desc: "Pantau status dengan tenang, lalu lengkapi daftar ulang tanpa biaya.",
  },
];

export default function PPDBBanner() {
  const { timeLeft, mounted } = useCountdown(PPDB_DATE);

  return (
    <section
      className="relative section-padding bg-brand-pine"
      aria-label="PPDB — Penerimaan Peserta Didik Baru"
    >
      <PhotoBackdrop src="/assets/sekolah/sekolah-09-pembelajaran.jpg" overlayClassName="bg-black/55" />

      <div className="container-custom relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display display-heading text-white">
              Cara Mudah Menjadi Bagian dari <span className="text-brand-lime">SMAN 68</span>
            </h2>
            <p className="mt-4 text-white/65 text-base md:text-lg leading-relaxed max-w-xl">
              Empat jalur resmi — Zonasi, Afirmasi, Perpindahan Tugas, dan Prestasi.
              Prosesnya transparan dan didampingi panitia sampai kamu resmi menjadi siswa.
            </p>

            <div className="mt-8 inline-flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 rounded-2xl border border-white/15 bg-white/5 px-7 py-6">
              <span className="flex items-center gap-2 text-brand-lime text-xs font-semibold uppercase tracking-wider">
                <Timer size={14} aria-hidden="true" />
                Menuju pembukaan
              </span>
              <span className="flex items-center justify-between sm:justify-start gap-5 sm:gap-7">
                <CountdownBox value={timeLeft.days} label="Hari" mounted={mounted} />
                <CountdownBox value={timeLeft.hours} label="Jam" mounted={mounted} />
                <CountdownBox value={timeLeft.minutes} label="Menit" mounted={mounted} />
                <CountdownBox value={timeLeft.seconds} label="Detik" mounted={mounted} />
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://ppdb.jakarta.go.id"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent"
              >
                <ExternalLink size={15} /> Buka Portal PPDB
              </a>
              <Link
                href="/ppdb/biaya"
                className="btn-secondary"
              >
                Biaya & Beasiswa
              </Link>
              <Link
                href="/ppdb"
                className="btn-secondary"
              >
                Alur & FAQ
                <ChevronRight size={15} />
              </Link>
            </div>
          </motion.div>

          <div className="space-y-4 lg:pl-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <span className="w-11 h-11 rounded-xl bg-brand-lime/15 flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-brand-lime" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="font-display font-extrabold text-xs text-brand-lime tabular-nums">
                        0{i + 1}
                      </span>
                      <span className="font-display font-bold text-white text-base">
                        {step.title}
                      </span>
                    </span>
                    <span className="block text-white/60 text-sm leading-relaxed mt-1">
                      {step.desc}
                    </span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
