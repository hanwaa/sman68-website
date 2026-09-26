"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, GraduationCap } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import type { TeacherContent } from "@/lib/content";
import { useContentResource } from "@/lib/use-content";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";

const MAPEL_FILTER = ["Semua", "Matematika & Sains", "Bahasa", "IPS", "Teknologi", "Seni & Olahraga", "Bimbingan"];

/** Inisial nama untuk avatar cadangan saat foto guru/staf kosong. */
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

const SUBJECT_MAPEL: Record<string, string> = {
  Matematika: "Matematika & Sains",
  Fisika: "Matematika & Sains",
  Kimia: "Matematika & Sains",
  Biologi: "Matematika & Sains",
  "Bahasa Indonesia": "Bahasa",
  "Bahasa Inggris": "Bahasa",
  Informatika: "Teknologi",
  Sejarah: "IPS",
  Ekonomi: "IPS",
  "Seni Budaya": "Seni & Olahraga",
  "Pendidikan Jasmani": "Seni & Olahraga",
  "Bimbingan Konseling": "Bimbingan",
};

export default function GuruStaf() {
  const { data: teacherContent, loading } = useContentResource<TeacherContent[]>("teachers", []);

  const teachers = teacherContent.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    subject: teacher.subject,
    position: teacher.position,
    mapel: SUBJECT_MAPEL[teacher.subject] ?? "",
    avatar: teacher.photo,
  }));

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");

  const filtered = teachers.filter((t) => {
    const matchQ = !query || t.name.toLowerCase().includes(query.toLowerCase()) || t.subject.toLowerCase().includes(query.toLowerCase());
    const matchF = activeFilter === "Semua" || t.mapel === activeFilter;
    return matchQ && matchF;
  });

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Guru &amp; <span className="text-brand-lime">Staf</span>
          </>
        }
        lead="Tenaga pendidik berdedikasi yang membentuk generasi terbaik SMAN 68 Jakarta."
      />

      <div className="container-custom py-10">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Cari guru berdasarkan nama atau mata pelajaran..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Filter size={14} className="text-muted mt-2 flex-shrink-0" />
          {MAPEL_FILTER.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`chip ${activeFilter === f ? "chip-active" : ""}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <Skeleton className="mb-6 h-4 w-52" />
        ) : (
          <p className="text-sm text-muted mb-6">
            Menampilkan <strong className="text-ink">{filtered.length}</strong> dari {teachers.length} pengajar
          </p>
        )}

        {loading && teachers.length === 0 && (
          <SkeletonGrid
            count={12}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            itemClassName="aspect-[3/4]"
          />
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((teacher, i) => (
              <motion.div
                layout
                key={teacher.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-xl bg-brand-pine"
              >
                {teacher.avatar ? (
                  <Image
                    src={teacher.avatar}
                    alt={teacher.name}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                  />
                ) : (
                  <span
                    className="absolute inset-0 flex items-center justify-center font-display text-2xl font-extrabold text-brand-lime/90"
                    aria-hidden="true"
                  >
                    {initials(teacher.name)}
                  </span>
                )}
                <span
                  className="absolute inset-0 bg-gradient-to-t from-brand-pine/95 via-brand-pine/45 to-brand-pine/5"
                  aria-hidden="true"
                />
                <span className="absolute inset-x-0 bottom-0 p-3">
                  <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.14em] text-brand-lime line-clamp-1">
                    {teacher.subject}
                  </span>
                  <span className="block font-display text-xs font-bold leading-snug text-white line-clamp-2">
                    {teacher.name}
                  </span>
                  <span className="mt-1 block text-[10px] text-white/70 line-clamp-1">
                    {teacher.position}
                  </span>
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-xl bg-cream border border-line flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={24} className="text-muted" aria-hidden="true" />
            </div>
            <div className="font-semibold text-ink">Guru tidak ditemukan</div>
            <div className="text-muted text-sm">Coba ubah filter atau kata kunci</div>
          </div>
        )}
      </div>
    </div>
  );
}

