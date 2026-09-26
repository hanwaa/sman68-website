"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Globe,
  Medal,
  Award,
  Star,
  Search,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalA11y } from "@/lib/useModalA11y";
import { useContentResource } from "@/lib/use-content";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";
import type { AchievementContent } from "@/lib/content";
import PageHero from "@/components/ui/PageHero";

const LEVEL_COLOR = "bg-brand-green/10 text-brand-green border-brand-green/20";

const LEVEL_CONFIG = {
  internasional: { color: LEVEL_COLOR, icon: Globe, label: "Internasional", ring: "ring-brand-leaf" },
  nasional: { color: LEVEL_COLOR, icon: Trophy, label: "Nasional", ring: "ring-brand-leaf" },
  provinsi: { color: LEVEL_COLOR, icon: Medal, label: "Provinsi", ring: "ring-brand-green" },
  kota: { color: LEVEL_COLOR, icon: Award, label: "Kota", ring: "ring-brand-leaf" },
  sekolah: { color: LEVEL_COLOR, icon: Star, label: "Sekolah", ring: "ring-muted" },
};

const AWARD_TYPE_LABELS: Record<AchievementContent["awardType"], string> = {
  juara1: "Juara 1",
  juara2: "Juara 2",
  juara3: "Juara 3",
  semifinal: "Semi Final",
  participasi: "Partisipasi",
  penghargaan: "Penghargaan",
};

const AWARD_TYPE_COLORS: Record<AchievementContent["awardType"], string> = {
  juara1: "bg-brand-green/10 text-brand-green",
  juara2: "bg-silver/10 text-muted",
  juara3: "bg-brand-mist text-brand-green",
  semifinal: "bg-brand-mist text-brand-green",
  participasi: "bg-cream text-muted",
  penghargaan: "bg-brand-green/10 text-brand-green",
};

const formatAchievementDate = (achievement: AchievementContent) =>
  achievement.createdAt
    ? new Date(achievement.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : `Tahun ${achievement.year}`;

const LEVELS = Object.keys(LEVEL_CONFIG) as (keyof typeof LEVEL_CONFIG)[];
const CATEGORIES = ["akademik", "olahraga", "seni", "teknologi", "sains", "sosial"];

export default function AchievementWall({
  initialAchievements,
}: {
  initialAchievements: AchievementContent[];
}) {
  const { data: achievements, loading } = useContentResource<AchievementContent[]>(
    "achievements",
    [],
    initialAchievements
  );
  const [query, setQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementContent | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const modalRef = useModalA11y<HTMLDivElement>(!!selectedAchievement, () =>
    setSelectedAchievement(null)
  );
  const [targetId, setTargetId] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("prestasi");
    if (id) setTargetId(id);
  }, []);

  useEffect(() => {
    setSlide(0);
  }, [query, selectedLevel, selectedCategory, selectedYear]);

  useEffect(() => {
    if (!targetId || !achievements.some((a) => a.id === targetId)) return;

    setSelectedLevel("all");
    setSelectedCategory("all");
    setSelectedYear(null);
    setHighlightedId(targetId);

    const targetIndex = achievements.findIndex((a) => a.id === targetId);
    if (targetIndex >= 0 && targetIndex < 3) setSlide(targetIndex);

    const scrollTimer = setTimeout(() => {
      document
        .getElementById(`prestasi-${targetId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 450);

    const clearTimer = setTimeout(() => setHighlightedId(null), 4500);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [targetId, achievements]);

  const years = useMemo(
    () => Array.from(new Set(achievements.map((a) => a.year))).sort((a, b) => b - a),
    [achievements]
  );

  const filtered = achievements.filter((a) => {
    if (selectedLevel !== "all" && a.level !== selectedLevel) return false;
    if (selectedCategory !== "all" && a.category !== selectedCategory) return false;
    if (selectedYear && a.year !== selectedYear) return false;

    const q = query.trim().toLowerCase();
    if (q) {
      const haystack = [
        a.title,
        a.description,
        a.category,
        a.level,
        String(a.year),
        ...(a.participants ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const highlightItems = filtered.slice(0, 3);
  const gridItems = filtered.slice(3);
  const safeSlide = highlightItems.length ? Math.min(slide, highlightItems.length - 1) : 0;
  const highlight = highlightItems[safeSlide];

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Dinding Prestasi <span className="text-brand-lime">SMAN 68</span>
          </>
        }
        lead="Setiap trofi, setiap medali, setiap penghargaan — semua adalah cerita tentang dedikasi siswa SMAN 68 Jakarta."
      >
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {[
            { value: "850+", label: "Total Prestasi" },
            { value: "48", label: "Internasional" },
            { value: "200+", label: "Nasional" },
            { value: "57", label: "Tahun" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display font-extrabold text-2xl text-brand-lime">{stat.value}</div>
              <div className="text-white/50 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </PageHero>

      {/* Sorotan prestasi — full width (ujung ke ujung) & bisa digeser */}
      {highlight && (
        <section aria-label="Sorotan prestasi" className="relative select-none">
          <div
            className="relative h-[320px] overflow-hidden sm:h-[400px] lg:h-[480px]"
            onPointerDown={(e) => {
              dragStart.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              if (!dragStart.current) return;
              const dx = e.clientX - dragStart.current.x;
              const dy = e.clientY - dragStart.current.y;
              dragStart.current = null;
              if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
                suppressClick.current = true;
                setSlide(
                  dx < 0
                    ? (safeSlide + 1) % highlightItems.length
                    : (safeSlide - 1 + highlightItems.length) % highlightItems.length
                );
              }
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.button
                key={highlight.id}
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  setSelectedAchievement(highlight);
                }}
                className="absolute inset-0 block h-full w-full text-left"
                aria-label={`Lihat detail: ${highlight.title}`}
              >
                <Image
                  src={highlight.cover}
                  alt=""
                  fill
                  draggable={false}
                  className="object-cover"
                  sizes="100vw"
                  priority
                />
                <span
                  className="absolute inset-0 bg-gradient-to-r from-brand-pine/95 via-brand-pine/70 to-brand-pine/20"
                  aria-hidden="true"
                />
                <span className="container-custom relative flex h-full flex-col justify-center">
                  <span className="mb-2.5 block text-sm text-white/70">
                    {formatAchievementDate(highlight)}
                  </span>
                  <span className="block max-w-2xl font-display text-xl font-extrabold leading-[1.3] text-white sm:text-2xl lg:text-3xl line-clamp-2">
                    {highlight.title}
                  </span>
                  <span className="mt-3 block max-w-2xl text-xs leading-[1.6] text-white/80 sm:text-sm line-clamp-3">
                    {highlight.description}
                  </span>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-lime">
                    → Selengkapnya
                  </span>
                </span>
              </motion.button>
            </AnimatePresence>

            {highlightItems.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Prestasi sebelumnya"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlide((safeSlide - 1 + highlightItems.length) % highlightItems.length);
                  }}
                  className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur transition-colors hover:bg-black/40 sm:flex"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Prestasi berikutnya"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlide((safeSlide + 1) % highlightItems.length);
                  }}
                  className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur transition-colors hover:bg-black/40 sm:flex"
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur">
                  {highlightItems.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Slide ${index + 1}`}
                      aria-current={index === safeSlide}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSlide(index);
                      }}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        index === safeSlide ? "w-5 bg-brand-lime" : "w-1.5 bg-white/50 hover:bg-white"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <div className="container-custom py-8">
        {/* Panel pencarian & filter */}
        <div className="mb-6 rounded-2xl border border-line bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari prestasi..."
                aria-label="Cari prestasi"
                className="w-full rounded-xl border border-line bg-cream/40 py-2.5 pl-9 pr-9 text-sm focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted transition-colors hover:bg-cream hover:text-ink"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 sm:justify-end">
              {loading ? (
                <Skeleton className="h-4 w-40" />
              ) : (
                <span className="text-xs text-muted" aria-live="polite">
                  Menampilkan <strong className="text-ink">{filtered.length}</strong> prestasi
                </span>
              )}
              {(query ||
                selectedLevel !== "all" ||
                selectedCategory !== "all" ||
                selectedYear !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelectedLevel("all");
                    setSelectedCategory("all");
                    setSelectedYear(null);
                  }}
                  className="btn-ghost btn-sm text-xs"
                >
                  <X size={12} aria-hidden="true" /> Reset
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-3 border-t border-line pt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="w-16 flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted">
                Tingkat
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedLevel("all")}
                  className={cn("chip", selectedLevel === "all" && "chip-active")}
                >
                  Semua
                </button>
                {LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level === selectedLevel ? "all" : level)}
                    className={cn("chip", selectedLevel === level && "chip-active")}
                  >
                    {LEVEL_CONFIG[level].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="w-16 flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted">
                Bidang
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={cn("chip", selectedCategory === "all" && "chip-active")}
                >
                  Semua
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat === selectedCategory ? "all" : cat)}
                    className={cn("chip capitalize", selectedCategory === cat && "chip-active")}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <span className="w-16 flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted">
                Tahun
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedYear(null)}
                  className={cn("chip", selectedYear === null && "chip-active")}
                >
                  Semua
                </button>
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                    className={cn("chip", selectedYear === year && "chip-active")}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading && filtered.length === 0 && (
          <SkeletonGrid
            key="prestasi-skeleton"
            count={6}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            itemClassName="h-56"
          />
        )}

        <motion.div
          key="prestasi-grid"
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            {gridItems.map((achievement, i) => {
              const config = LEVEL_CONFIG[achievement.level];
              const Icon = config.icon;
              return (
                <motion.article
                  layout
                  key={achievement.id}
                  id={`prestasi-${achievement.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedAchievement(achievement)}
                  className={cn(
                    "card cursor-pointer group flex flex-col transition-all",
                    highlightedId === achievement.id &&
                      "ring-2 ring-brand-lime border-brand-lime bg-brand-lime/5"
                  )}
                >
                  <div className="relative aspect-video overflow-hidden bg-line">
                    <Image
                      src={achievement.cover}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h2 className="font-display font-bold text-ink text-sm mb-2 leading-snug group-hover:text-brand-green transition-colors line-clamp-2">
                      {achievement.title}
                    </h2>

                    <p className="text-xs text-muted leading-relaxed line-clamp-3 mb-3">
                      {achievement.description}
                    </p>

                    <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-line pt-3 text-[10px] text-muted">
                      <span className={cn("badge border text-[10px]", config.color)}>
                        <Icon size={10} aria-hidden="true" />
                        {config.label}
                      </span>
                      <span className="font-semibold uppercase tracking-wider capitalize">
                        {achievement.category}
                      </span>
                      <span className="ml-auto tabular-nums">
                        {formatAchievementDate(achievement)}
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <Trophy size={40} className="text-line mx-auto mb-4" />
            <div className="text-ink font-semibold">Tidak ada prestasi ditemukan</div>
            <div className="text-muted text-sm">Coba ubah filter untuk melihat lebih banyak</div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAchievement && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={selectedAchievement.title}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-card-hover focus:outline-none"
            >
              {(() => {
                const a = selectedAchievement;
                const config = LEVEL_CONFIG[a.level];
                const Icon = config.icon;
                const participantList = a.participants?.length
                  ? a.participants
                  : a.studentName
                    ? [a.studentName]
                    : [];
                return (
                  <>
                    <button
                      onClick={() => setSelectedAchievement(null)}
                      className="btn-icon absolute right-3 top-3 z-10 bg-white/90 shadow-sm backdrop-blur"
                      aria-label="Tutup"
                    >
                      <X size={16} />
                    </button>

                    <div className="relative aspect-[16/10] overflow-hidden bg-line">
                      <Image
                        src={a.cover}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 512px"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-brand-pine/40 to-transparent" aria-hidden="true" />
                      <span className={cn("badge border absolute left-4 bottom-4 shadow-sm", config.color)}>
                        <Icon size={11} aria-hidden="true" />
                        {config.label}
                      </span>
                    </div>

                    <div className="p-6 md:p-7">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-muted">
                        <span className={cn("badge", AWARD_TYPE_COLORS[a.awardType])}>
                          {AWARD_TYPE_LABELS[a.awardType]}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={12} aria-hidden="true" />
                          <span className="tabular-nums">{formatAchievementDate(a)}</span>
                        </span>
                      </div>

                      <h2 className="mt-3 font-display text-xl font-extrabold leading-snug text-ink md:text-2xl">
                        {a.title}
                      </h2>

                      {a.description && (
                        <p className="mt-3 text-sm leading-relaxed text-muted">{a.description}</p>
                      )}

                      {participantList.length > 0 && (
                        <div className="mt-5 border-t border-line pt-4">
                          <div className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                            Peserta
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {participantList.map((p) => (
                              <span key={p} className="badge bg-brand-green/10 text-brand-green">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {a.newsSlug && (
                        <div className="mt-5 border-t border-line pt-4">
                          <Link
                            href={`/berita/${a.newsSlug}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:underline"
                          >
                            <Newspaper size={12} aria-hidden="true" />
                            {a.newsTitle
                              ? `Baca berita: ${a.newsTitle}`
                              : "Baca berita terkait"}
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
