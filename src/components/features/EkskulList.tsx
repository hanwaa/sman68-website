"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Users, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EKSKUL_CATEGORIES, type Ekskul } from "@/lib/ekskul";
import { useModalA11y } from "@/lib/useModalA11y";
import { useContentResource } from "@/lib/use-content";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";
import PageHero from "@/components/ui/PageHero";

const CATEGORIES = ["Semua", ...EKSKUL_CATEGORIES];

function initials(name: string) {
  const words = name.split(" ");
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function LogoBox({
  ekskul,
  className,
  sizes,
  padding = "p-6",
}: {
  ekskul: Ekskul;
  className: string;
  sizes: string;
  padding?: string;
}) {
  return (
    <div className={cn("relative rounded-xl bg-cream border border-line overflow-hidden", className)}>
      {ekskul.logo ? (
        <Image
          src={ekskul.logo}
          alt={`Logo ${ekskul.name}`}
          fill
          className={cn("object-contain", padding)}
          sizes={sizes}
        />
      ) : (
        <div className="absolute inset-0 bg-brand-pine flex flex-col items-center justify-center">
          <span className="font-display font-extrabold text-2xl text-brand-lime">
            {initials(ekskul.name)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function EkskulList({ initialEkskul }: { initialEkskul: Ekskul[] }) {
  const { data: ekskulList, loading } = useContentResource<Ekskul[]>("ekskul", [], initialEkskul);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Ekskul | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const modalRef = useModalA11y<HTMLDivElement>(!!selected, () => setSelected(null));
  const [targetId, setTargetId] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("ekskul");
    if (id) setTargetId(id);
  }, []);

  useEffect(() => {
    if (!targetId || !ekskulList.some((e) => e.id === targetId)) return;

    setActiveCategory("Semua");
    setQuery("");
    setHighlightedId(targetId);

    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(`ekskul-${targetId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 450);

    const clearTimer = setTimeout(() => setHighlightedId(null), 4500);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [targetId, ekskulList]);

  const filtered = ekskulList.filter((e) => {
    const matchCat = activeCategory === "Semua" || e.category === activeCategory;
    const matchQ = !query || e.name.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  const totalMembers = ekskulList.reduce((a, b) => a + b.members, 0);
  const totalAchievements = ekskulList.reduce((a, b) => a + b.achievements, 0);

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Temukan Passionmu <span className="text-brand-lime">di SMAN 68</span>
          </>
        }
        lead={loading ? "Daftar ekskul dan organisasi aktif di SMAN 68 Jakarta." : `${ekskulList.length} ekskul dan organisasi aktif menunggu kontribusimu.`}
      >
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {[
            { value: ekskulList.length, label: "Ekskul Aktif", sk: loading },
            { value: totalMembers + "+", label: "Anggota Total", sk: loading },
            { value: totalAchievements + "+", label: "Prestasi", sk: loading },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display font-extrabold text-2xl text-brand-lime">
                {stat.sk ? <Skeleton className="h-7 w-12" /> : stat.value}
              </div>
              <div className="text-white/50 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </PageHero>

      <div className="container-custom py-10">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Cari ekskul..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          <Filter size={14} className="text-muted mt-2 flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn("chip", activeCategory === cat ? "chip-active" : "")}
            >
              {cat}
            </button>
          ))}
        </div>

        <AnimatePresence mode="popLayout">
          {loading && filtered.length === 0 && (
          <SkeletonGrid
            key="ekskul-skeleton"
            count={8}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            itemClassName="h-60"
          />
        )}

        <motion.div
          key="ekskul-grid"
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
            {filtered.map((ekskul, i) => (
              <motion.article
                layout
                key={ekskul.id}
                id={`ekskul-${ekskul.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelected(ekskul)}
                className={cn(
                  "card p-4 cursor-pointer group transition-all",
                  highlightedId === ekskul.id &&
                    "ring-2 ring-brand-lime border-brand-lime bg-brand-lime/5"
                )}
              >
                <LogoBox
                  ekskul={ekskul}
                  className="aspect-[4/3] mb-4"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <span className="badge bg-cream text-muted text-[10px] mb-2">{ekskul.category}</span>
                <h2 className="font-display font-bold text-ink text-sm mb-2 group-hover:text-brand-green transition-colors">
                  {ekskul.name}
                </h2>
                <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-3">{ekskul.desc}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted">
                    <Users size={10} />
                    {ekskul.members} anggota
                  </span>
                  <span className="flex items-center gap-1 text-brand-green font-semibold">
                    <Trophy size={10} />
                    {ekskul.achievements} prestasi
                  </span>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-xl bg-white border border-line flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-muted" aria-hidden="true" />
            </div>
            <div className="font-semibold text-ink">Ekskul tidak ditemukan</div>
            <div className="text-muted text-sm mt-1">Coba ubah filter atau kata kunci pencarian</div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
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
              aria-label={selected.name}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-xl p-6 sm:p-8 max-w-md w-full shadow-card overflow-hidden focus:outline-none"
            >
              <button
                onClick={() => setSelected(null)}
                className="btn-icon absolute top-4 right-4 z-10 bg-white/80 hover:bg-white"
                aria-label="Tutup detail"
              >
                <X size={18} />
              </button>

              <LogoBox
                ekskul={selected}
                className="aspect-[16/9] mb-5"
                sizes="(max-width: 640px) 100vw, 448px"
                padding="p-8"
              />

              <span className="badge bg-cream text-muted text-xs mb-2">{selected.category}</span>
              <h2 className="font-display font-extrabold text-2xl text-ink mb-2">{selected.name}</h2>
              <p className="text-muted text-sm leading-relaxed mb-5">{selected.desc}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Anggota", value: selected.members + " siswa" },
                  { label: "Prestasi", value: selected.achievements + " penghargaan" },
                  { label: "Jadwal", value: selected.schedule },
                  { label: "Pembina", value: selected.advisor },
                ].map((item) => (
                  <div key={item.label} className="bg-cream rounded-xl p-3">
                    <div className="text-xs text-muted">{item.label}</div>
                    <div className="font-semibold text-ink text-sm mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

