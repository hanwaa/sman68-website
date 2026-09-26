"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Star,
  ChevronRight,
  ChevronLeft,
  Globe,
  Award,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContentResource } from "@/lib/use-content";
import type { AchievementContent } from "@/lib/content";
import SectionHeader from "@/components/ui/SectionHeader";

const LEVEL_CONFIG = {
  internasional: { color: "bg-brand-lime text-brand-pine", icon: Globe, label: "Internasional" },
  nasional: { color: "bg-brand-green text-white", icon: Trophy, label: "Nasional" },
  provinsi: { color: "bg-brand-leaf/15 text-brand-green", icon: Medal, label: "Provinsi" },
  kota: { color: "bg-brand-mist text-brand-green", icon: Award, label: "Kota" },
  sekolah: { color: "bg-line text-muted", icon: Star, label: "Sekolah" },
};

function chunk<T>(items: T[], size: number): T[][] {
  return items.reduce<T[][]>((acc, _, i) => {
    if (i % size === 0) acc.push(items.slice(i, i + size));
    return acc;
  }, []);
}

export default function AchievementSection() {
  const { data: achievements, loading } = useContentResource<AchievementContent[]>("achievements", []);
  const highlights = achievements.slice(0, 8);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(3);

  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const sm = window.matchMedia("(min-width: 640px)");
    const update = () => {
      const next = md.matches ? 3 : sm.matches ? 2 : 1;
      setPerPage((p) => (p === next ? p : next));
    };
    update();
    md.addEventListener("change", update);
    sm.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      sm.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    setPage(0);
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [perPage]);

  const pages = chunk(highlights, perPage);
  const lastPage = pages.length - 1;

  const goTo = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const target = Math.min(Math.max((page + dir) * width, 0), el.scrollWidth - width);
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <section className="section-padding bg-cream" aria-label="Prestasi — Bukti Nyata">
      <div className="container-custom">
        <SectionHeader
          align="center"
          title={
            <>
              Kami Tidak Hanya <span className="text-brand-leaf">Bercita-cita</span>
            </>
          }
          lead="Setiap tahun, siswa SMAN 68 membuktikan diri di berbagai kompetisi — dari tingkat kota hingga panggung internasional."
        />

        <div className="relative mt-12">
          {loading && highlights.length === 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
              <span className="sr-only">Memuat prestasi...</span>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-line/70" />
              ))}
            </div>
          )}
          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          >
            {pages.map((group, i) => (
              <div
                key={i}
                className="min-w-full snap-center grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pr-1"
              >
                {group.map((achievement) => {
                  const config = LEVEL_CONFIG[achievement.level];
                  const Icon = config.icon;
                  return (
                    <Link
                      key={achievement.id}
                      href={`/prestasi?prestasi=${achievement.id}`}
                      className="card h-full flex flex-col group"
                    >
                      <div className="relative aspect-video overflow-hidden bg-line">
                        <Image
                          src={achievement.cover}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        />
                        <span className={cn("badge absolute top-3 left-3", config.color)}>
                          <Icon size={11} aria-hidden="true" />
                          {config.label}
                        </span>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <h3 className="font-display font-bold text-ink text-base leading-snug group-hover:text-brand-green transition-colors line-clamp-2">
                            {achievement.title}
                          </h3>
                          <span className="text-xs text-muted tabular-nums flex-shrink-0">
                            {achievement.year}
                          </span>
                        </div>
                        <p className="text-muted text-sm leading-relaxed mt-0 line-clamp-3">
                          {achievement.description}
                        </p>
                        <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-green opacity-0 group-hover:opacity-100 transition-opacity">
                          Lihat Detail
                          <ArrowRight size={12} aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <button
            onClick={() => goTo(-1)}
            disabled={page === 0}
            className="btn-icon absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 rounded-full border border-line bg-white shadow-card hover:bg-brand-pine hover:text-white md:flex"
            aria-label="Prestasi sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => goTo(1)}
            disabled={page === lastPage}
            className="btn-icon absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 rounded-full border border-line bg-white shadow-card hover:bg-brand-pine hover:text-white md:flex"
            aria-label="Prestasi berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = scrollerRef.current;
                if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === page ? "w-6 bg-brand-green" : "w-1.5 bg-line hover:bg-muted"
              }`}
              aria-label={`Halaman prestasi ${i + 1}`}
              aria-current={i === page ? "true" : undefined}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/prestasi" className="btn-ghost inline-flex">
            Lihat Semua Prestasi
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
