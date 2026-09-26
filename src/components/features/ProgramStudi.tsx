"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, GraduationCap, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { studyPrograms } from "@/lib/program-studi";

export default function ProgramStudi() {
  const [activeId, setActiveId] = useState(studyPrograms[0].id);

  const program = useMemo(
    () => studyPrograms.find((item) => item.id === activeId) ?? studyPrograms[0],
    [activeId]
  );

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = studyPrograms.findIndex((item) => item.id === activeId);
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % studyPrograms.length
        : (index - 1 + studyPrograms.length) % studyPrograms.length;
    setActiveId(studyPrograms[next].id);
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Pilih program studi"
        onKeyDown={handleTabKeyDown}
        className="mb-6 flex flex-wrap gap-2"
      >
        {studyPrograms.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setActiveId(item.id)}
              className={cn("chip", active && "chip-active")}
            >
              <Icon size={13} aria-hidden="true" />
              {item.name}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={program.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Panel program */}
          <div
            className={cn(
              "relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-xl shadow-brand-pine/15 ring-1 ring-inset ring-white/10 sm:p-8",
              program.panel
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
              aria-hidden="true"
            >
              <div className="absolute inset-0 pattern-grid opacity-40" />
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            </div>

            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                  <Sparkles size={11} aria-hidden="true" />
                  Peminatan
                </span>
                <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
                  {program.name}
                </h2>
                <p className="mt-1 text-sm text-white/70">{program.fullName}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/85">{program.desc}</p>

                <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white/85">
                    <Users size={11} aria-hidden="true" />
                    {program.kelas}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white/85">
                    <GraduationCap size={11} aria-hidden="true" />
                    {program.rombel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white/85">
                    <BookOpen size={11} aria-hidden="true" />
                    {program.subjects.length} mapel peminatan
                  </span>
                </div>
              </div>

              <div className="hidden h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/20 md:flex">
                <program.icon size={42} className="text-brand-lime" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Mata pelajaran + logo */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {program.subjects.map((subject, index) => {
              const Icon = subject.icon;
              return (
                <motion.div
                  key={subject.name}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
                  className="card flex items-start gap-3.5 p-4"
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl",
                      subject.tone
                    )}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-sm font-bold text-ink">
                      {subject.name}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {subject.desc}
                    </span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
