"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Tag, Clock, Eye, ChevronRight, Filter, Newspaper } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import PageHero from "@/components/ui/PageHero";
import InstagramHighlight from "@/components/features/InstagramHighlight";
import type { NewsArticle } from "@/lib/news";
import { useContentResource } from "@/lib/use-content";
import { useInstagramFeed } from "@/lib/use-instagram";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";

const CATEGORIES = ["Semua", "Prestasi", "Kegiatan", "Pengumuman", "Akademik", "Alumni"];

const catColors: Record<string, string> = {
  Prestasi: "bg-brand-green/10 text-brand-green",
  Kegiatan: "bg-brand-green/10 text-brand-green",
  Pengumuman: "bg-brand-pine/10 text-brand-pine",
  Akademik: "bg-brand-green/10 text-brand-green",
  Alumni: "bg-brand-leaf/15 text-brand-green",
};

export default function BeritaList({ initialArticles }: { initialArticles: NewsArticle[] }) {
  const { data: articles, loading: newsLoading } = useContentResource<NewsArticle[]>("news", [], initialArticles);
  const { feed: instagramFeed, loading: instagramLoading } = useInstagramFeed();
  const instagramPending = instagramLoading || (Boolean(instagramFeed) && newsLoading);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [query, setQuery] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [targetSlug, setTargetSlug] = useState<string | null>(null);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("berita");
    if (slug) setTargetSlug(slug);
  }, []);

  useEffect(() => {
    if (!targetSlug) return;
    const target = articles.find((a) => a.slug === targetSlug);
    if (!target) return;

    setActiveCategory("Semua");
    setQuery("");
    setHighlightedId(target.id);

    const scrollTimer = setTimeout(() => {
      document
        .getElementById(`berita-${target.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 450);

    const clearTimer = setTimeout(() => setHighlightedId(null), 4500);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [targetSlug, articles]);

  const filtered = articles.filter((a) => {
    const matchCat = activeCategory === "Semua" || a.category === activeCategory;
    const matchQ = !query || a.title.toLowerCase().includes(query.toLowerCase()) || a.excerpt.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Selalu Ada Cerita Baru <span className="text-brand-lime">dari SMAN 68</span>
          </>
        }
        lead="Ikuti perkembangan terbaru: prestasi, kegiatan, dan pengumuman resmi dari SMAN 68 Jakarta."
      />

      <div className="container-custom py-10">
        <InstagramHighlight feed={instagramFeed} loading={instagramPending} />

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Cari berita..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-line bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-muted flex-shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn("chip", activeCategory === cat && "chip-active")}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {newsLoading ? (
          <Skeleton className="mb-6 h-4 w-44" />
        ) : (
          <p className="text-sm text-muted mb-6">
            Menampilkan <strong className="text-ink">{filtered.length}</strong> artikel
          </p>
        )}

        {newsLoading && (
          <SkeletonGrid count={3} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" itemClassName="h-64" />
        )}

        <AnimatePresence mode="popLayout">
          {newsLoading ? null : filtered.length > 0 ? (
            <motion.div layout>
              {featured && (
                <motion.article
                  layout
                  id={`berita-${featured.id}`}
                  key={featured.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "card mb-6 group cursor-pointer overflow-hidden hover:-translate-y-1",
                    highlightedId === featured.id &&
                      "ring-2 ring-brand-lime border-brand-lime bg-brand-lime/5"
                  )}
                >
                  <Link href={`/berita/${featured.slug}`} className="grid md:grid-cols-2">
                    <div className="relative aspect-video md:aspect-auto min-h-[220px] overflow-hidden">
                      <Image src={featured.cover} alt={featured.title} fill className="object-cover transition-transform duration-200 ease-out group-hover:scale-105" sizes="(max-width:768px) 100vw, 50vw" />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-pine/50 to-transparent" />
                      <span className={`absolute top-4 left-4 badge ${catColors[featured.category]}`}>
                        <Tag size={10} />{featured.category}
                      </span>
                    </div>
                    <div className="p-6 md:p-8 flex flex-col justify-center">
                      <span className="text-xs text-muted mb-2">ARTIKEL TERBARU</span>
                      <h2 className="font-display font-extrabold text-xl md:text-2xl text-ink mb-3 group-hover:text-brand-green transition-colors leading-snug">
                        {featured.title}
                      </h2>
                      <p className="text-muted text-sm leading-relaxed mb-4 line-clamp-3">{featured.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-muted mt-auto">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock size={11} />{formatDate(featured.publishedAt)}</span>
                          <span className="flex items-center gap-1"><Eye size={11} />{featured.views.toLocaleString("id-ID")}</span>
                        </div>
                        <span className="text-brand-green font-semibold group-hover:gap-2 flex items-center gap-1 transition-colors duration-200 ease-out">Baca <ChevronRight size={13} /></span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rest.map((article, i) => (
                  <motion.article
                    layout
                    id={`berita-${article.id}`}
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                    className={cn(
                      "group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer bg-brand-pine transition-transform duration-200 ease-out hover:-translate-y-1",
                      highlightedId === article.id &&
                        "ring-2 ring-brand-lime border border-brand-lime"
                    )}
                  >
                    <Link href={`/berita/${article.slug}`} className="absolute inset-0">
                      <Image
                        src={article.cover}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-brand-pine/95 via-brand-pine/45 to-brand-pine/10" />
                      <span className="absolute inset-x-0 bottom-0 p-4">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-lime mb-1.5">
                          {article.category}
                        </span>
                        <span className="block font-display font-bold text-white text-sm leading-snug line-clamp-2 group-hover:underline decoration-brand-lime/60 decoration-2 underline-offset-4">
                          {article.title}
                        </span>
                        <span className="mt-2.5 flex items-center gap-3 text-[11px] text-white/70">
                          <span className="flex items-center gap-1">
                            <Clock size={10} aria-hidden="true" />
                            {formatDate(article.publishedAt, { day: "numeric", month: "short" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye size={10} aria-hidden="true" />
                            {article.views.toLocaleString("id-ID")}
                          </span>
                        </span>
                      </span>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-14 h-14 rounded-xl bg-cream border border-line flex items-center justify-center mx-auto mb-4">
                <Newspaper size={24} className="text-muted" aria-hidden="true" />
              </div>
              <div className="font-semibold text-ink">Tidak ada berita ditemukan</div>
              <div className="text-muted text-sm mt-1">Coba ubah filter atau kata kunci pencarian</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
