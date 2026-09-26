"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Timer,
  ExternalLink,
  Info,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PageHero from "@/components/ui/PageHero";
import { schoolData } from "@/lib/school-data";
import { useContent } from "@/lib/use-content";

const STEP_REQUIREMENTS: string[][] = [
  [
    "Kartu Keluarga (KK) asli dan fotokopi",
    "Akta Kelahiran asli dan fotokopi",
    "Ijazah/SKHUN SMP atau sederajat",
    "Rapor SMP semester 1-5",
    "Pas foto 3×4 (6 lembar, latar merah)",
    "Sertifikat prestasi (jika ada)",
  ],
  [
    "Buka portal ppdb.jakarta.go.id",
    "Pilih jalur pendaftaran yang sesuai",
    "Isi formulir pendaftaran dengan lengkap",
    "Upload semua dokumen yang diperlukan",
    "Verifikasi data dan submit formulir",
  ],
  [
    "Pastikan data sudah diverifikasi sistem",
    "Pantau status pendaftaran secara berkala",
    "Siapkan dokumen asli untuk verifikasi offline",
    "Ikuti jadwal tes/wawancara (jika ada)",
  ],
  [
    "Cek pengumuman hasil seleksi di portal",
    "Jika diterima, lengkapi berkas daftar ulang — tanpa biaya",
    "Ikuti orientasi siswa baru",
  ],
];

const STEP_COLORS = ["bg-brand-green", "bg-brand-leaf", "bg-brand-leaf", "bg-brand-green"];

export default function PPDBGuide() {
  const ppdb = useContent<{
    steps: { title: string; description: string }[];
    schedule: { label: string; date: string; note?: string }[];
    fees: { label: string; amount: string; note?: string }[];
    scholarships: { title: string; description: string }[];
  }>("ppdb", { steps: [], schedule: [], fees: [], scholarships: [] });
  const faqContentData = useContent<{ id: string; question: string; answer: string; category: string }[]>("faqs", []);

  const steps = ppdb.steps.map((step, i) => ({
    id: i + 1,
    title: step.title,
    description: step.description,
    requirements: STEP_REQUIREMENTS[i] ?? [],
    color: STEP_COLORS[i] ?? "",
  }));

  const schedule = ppdb.schedule;

  const faqs = faqContentData.filter((faq) => faq.category === "ppdb");

  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const countdown = {
    days: 28,
    hours: 14,
    minutes: 32,
  };

  const toggleStep = (id: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Cara Mudah Menjadi Bagian{" "}
            <span className="text-brand-lime">dari SMAN 68</span>
          </>
        }
        lead="Kami pandu langkah demi langkah, dari menyiapkan dokumen sampai daftar ulang — supaya tidak bingung dan tidak terlambat."
      >
        <div className="inline-flex items-center gap-6 bg-white/10 border border-white/20 rounded-xl px-7 py-5">
          <Timer size={20} className="text-brand-lime" aria-hidden="true" />
          <div className="text-center">
            <div className="font-display font-extrabold text-3xl text-white">{countdown.days}</div>
            <div className="text-white/50 text-xs">Hari</div>
          </div>
          <div className="text-white/30 text-2xl font-thin">:</div>
          <div className="text-center">
            <div className="font-display font-extrabold text-3xl text-white">{countdown.hours}</div>
            <div className="text-white/50 text-xs">Jam</div>
          </div>
          <div className="text-white/30 text-2xl font-thin">:</div>
          <div className="text-center">
            <div className="font-display font-extrabold text-3xl text-white">{countdown.minutes}</div>
            <div className="text-white/50 text-xs">Menit</div>
          </div>
          <div className="text-white/50 text-sm hidden sm:block">menuju pembukaan PPDB</div>
        </div>
      </PageHero>

      <div className="container-custom py-12">
        <div className="card p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5 border-brand-leaf/30">
          <div className="max-w-xl">
            <h2 className="font-display font-extrabold text-xl text-ink mb-1.5">
              Daftar di Portal Resmi PPDB Jakarta
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              Pendaftaran hanya melalui <strong>ppdb.jakarta.go.id</strong> — tanpa biaya dan tanpa
              perantara. Siapkan dokumen lalu ikuti panduan langkah di bawah.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 flex-shrink-0">
            <a
              href="https://ppdb.jakarta.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm px-5 py-2.5"
            >
              <ExternalLink size={15} /> Buka Portal PPDB
            </a>
            <Link href="/ppdb/biaya" className="btn-ghost text-sm px-5 py-2.5">
              Biaya & Beasiswa
            </Link>
            <Link href="/ppdb/faq" className="btn-ghost text-sm px-5 py-2.5">
              FAQ
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-8">
          {[
            { icon: CheckCircle2, text: "Gratis — tanpa biaya pendaftaran" },
            { icon: ShieldCheck, text: "Aman — hanya portal resmi" },
            { icon: HeartHandshake, text: "Ditemani sampai daftar ulang" },
          ].map(({ icon: Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-line px-4 py-2 text-xs font-semibold text-ink"
            >
              <Icon size={14} className="text-brand-green" aria-hidden="true" />
              {text}
            </span>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <motion.div
              id="alur"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="scroll-mt-24"
            >
              <h2 className="font-display font-extrabold text-2xl text-ink mb-2">
                Panduan Langkah demi Langkah
              </h2>
              <p className="text-muted text-sm mb-6">
                Centang setiap langkah yang sudah kamu selesaikan.
              </p>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted">Progress</span>
                  <span className="text-xs font-semibold text-brand-green">
                    {completedSteps.size}/{steps.length} langkah
                  </span>
                </div>
                <div className="h-2 bg-line rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-green rounded-full"
                    animate={{ width: `${(completedSteps.size / steps.length) * 100}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {steps.map((step, i) => {
                  const isCompleted = completedSteps.has(step.id);
                  const isOpen = activeStep === step.id;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn("card overflow-hidden", isCompleted && "border-brand-leaf/40")}
                    >
                      <div className="w-full flex items-center gap-4 p-4">
                        <button
                          onClick={() => toggleStep(step.id)}
                          className="flex-shrink-0 p-1 -m-1 rounded-full"
                          aria-label={isCompleted ? "Tandai belum selesai" : "Tandai selesai"}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={22} className="text-brand-leaf" />
                          ) : (
                            <Circle size={22} className="text-line hover:text-brand-leaf transition-colors" />
                          )}
                        </button>
                        <button
                          onClick={() => setActiveStep(isOpen ? null : step.id)}
                          className="flex-1 min-w-0 flex items-center gap-4 text-left hover:opacity-80 transition-opacity"
                          aria-expanded={isOpen}
                        >
                          <span className="w-7 flex-shrink-0 font-display font-extrabold text-sm text-muted tabular-nums">
                            {String(step.id).padStart(2, "0")}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-ink text-sm">{step.title}</div>
                          </div>
                          <ChevronDown
                            size={16}
                            className={cn("text-muted transition-transform flex-shrink-0", isOpen && "rotate-180")}
                          />
                        </button>
                      </div>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="px-4 pb-4 border-t border-line pt-3">
                              <p className="text-muted text-sm mb-3">{step.description}</p>
                              <ul className="space-y-2">
                                {step.requirements.map((req, j) => (
                                  <li key={j} className="flex items-start gap-2 text-sm text-ink">
                                    <ChevronRight size={14} className="text-brand-green mt-0.5 flex-shrink-0" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-10"
            >
              <h2 className="font-display font-extrabold text-2xl text-ink mb-6">FAQ</h2>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="card overflow-hidden">
                    <button
                      onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                      className="w-full flex items-start gap-3 p-4 text-left hover:bg-cream transition-colors"
                      aria-expanded={activeFaq === i}
                    >
                      <Info size={16} className="text-brand-green flex-shrink-0 mt-0.5" />
                      <span className="font-semibold text-ink text-sm flex-1">{faq.question}</span>
                      <ChevronDown
                        size={16}
                        className={cn("text-muted transition-transform flex-shrink-0", activeFaq === i && "rotate-180")}
                      />
                    </button>
                    <AnimatePresence>
                      {activeFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <div className="px-4 pb-4 border-t border-line pt-3 text-sm text-muted leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-5"
            >
              <h3 className="font-display font-bold text-ink text-base mb-4 flex items-center gap-2">
                <Timer size={16} className="text-brand-green" />
                Jadwal PPDB
              </h3>
              <div className="space-y-0">
                {schedule.map((item, i) => (
                  <div key={i} className="relative pl-5 pb-4 last:pb-0">
                    <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-brand-green" />
                    {i < schedule.length - 1 && (
                      <span className="absolute left-[3px] top-4 bottom-0 w-px bg-line" />
                    )}
                    <div className="text-sm font-medium text-ink">{item.label}</div>
                    <div className="text-xs text-muted">{item.date}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.a
              href="https://ppdb.jakarta.go.id"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-5 flex items-center gap-3 group hover:border-brand-green/40 border border-transparent transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center flex-shrink-0">
                <ExternalLink size={18} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-ink text-sm group-hover:text-brand-green transition-colors">
                  Portal PPDB DKI Jakarta
                </div>
                <div className="text-xs text-muted">ppdb.jakarta.go.id</div>
              </div>
              <ChevronRight size={16} className="text-muted ml-auto" />
            </motion.a>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-brand-pine rounded-xl p-5 text-white"
            >
              <h3 className="font-display font-bold text-base mb-2">Tanya apa saja, kami bantu</h3>
              <p className="text-white/60 text-xs leading-relaxed mb-4">
                Tim kami siap membantu — dari dokumen sampai daftar ulang.
              </p>
              <div className="space-y-2 text-xs">
                <a href={schoolData.kontak.teleponHref} className="flex items-center gap-2 text-brand-leaf hover:text-brand-leaf/80 transition-colors">
                  {schoolData.kontak.telepon}
                </a>
                <a href={schoolData.kontak.emailHref} className="flex items-center gap-2 text-brand-leaf hover:text-brand-leaf/80 transition-colors">
                  {schoolData.kontak.email}
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
