"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  ChevronDown,
  Globe,
  Medal,
  Newspaper,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AchievementContent } from "@/lib/content";

const LEVEL_META: Record<
  AchievementContent["level"],
  { label: string; icon: LucideIcon; badge: string }
> = {
  internasional: { label: "Internasional", icon: Globe, badge: "bg-brand-lime/15 text-ink" },
  nasional: { label: "Nasional", icon: Trophy, badge: "bg-brand-green/10 text-brand-green" },
  provinsi: { label: "Provinsi", icon: Medal, badge: "bg-brand-mist text-brand-leaf" },
  kota: { label: "Kota", icon: Award, badge: "bg-brand-mist text-brand-leaf" },
  sekolah: { label: "Sekolah", icon: Star, badge: "bg-cream text-muted" },
};

const AWARD_LABEL: Record<AchievementContent["awardType"], string> = {
  juara1: "Juara 1",
  juara2: "Juara 2",
  juara3: "Juara 3",
  semifinal: "Semi Final",
  participasi: "Partisipasi",
  penghargaan: "Penghargaan",
};

type Range = "year" | "all";

/** Batas "1 tahun ke belakang" dihitung dari tanggal prestasi, bukan kolom tahun. */
function withinLastYear(achievement: AchievementContent): boolean {
  const reference = achievement.createdAt
    ? new Date(achievement.createdAt)
    : new Date(`${achievement.year}-12-31T23:59:59Z`);
  if (Number.isNaN(reference.getTime())) return true;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return reference.getTime() >= oneYearAgo.getTime();
}

function AchievementRow({ achievement }: { achievement: AchievementContent }) {
  const meta = LEVEL_META[achievement.level] ?? LEVEL_META.sekolah;
  const Icon = meta.icon;
  const hasNews = Boolean(achievement.newsSlug);

  return (
    <li className="rounded-xl border border-line bg-white p-3.5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
            meta.badge
          )}
        >
          <Icon size={15} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="tabular-nums text-[11px] font-bold text-brand-green">
              {achievement.year}
            </span>
            <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-medium text-muted">
              {meta.label}
            </span>
            <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-medium text-muted">
              {AWARD_LABEL[achievement.awardType] ?? achievement.awardType}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold leading-snug text-ink">
            {achievement.title}
          </p>
          {achievement.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
              {achievement.description}
            </p>
          )}
          {achievement.participants && achievement.participants.length > 0 && (
            <p className="mt-1.5 text-[11px] text-muted">
              Peserta: {achievement.participants.join(", ")}
            </p>
          )}
          {hasNews && (
            <Link
              href={`/berita/${achievement.newsSlug}`}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-green hover:underline"
            >
              <Newspaper size={11} aria-hidden="true" />
              Baca beritanya
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * Riwayat prestasi satu ekskul. Default menampilkan 1 tahun ke belakang;
 * bisa diperluas ke seluruh riwayat sesuai data yang tersedia.
 */
export default function EkskulAchievements({
  ekskulId,
  achievements,
}: {
  ekskulId: string;
  achievements: AchievementContent[];
}) {
  const [range, setRange] = useState<Range>("year");
  const [expanded, setExpanded] = useState(false);

  const mine = useMemo(
    () =>
      achievements
        .filter((achievement) => achievement.ekskulId === ekskulId)
        .sort((a, b) => b.year - a.year),
    [achievements, ekskulId]
  );

  const recent = useMemo(() => mine.filter(withinLastYear), [mine]);
  const shown = range === "year" ? recent : mine;
  const visible = expanded ? shown : shown.slice(0, 3);
  const hidden = shown.length - visible.length;

  const counts = useMemo(
    () => ({
      all: mine.length,
      year: recent.length,
    }),
    [mine, recent]
  );

  if (mine.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line p-4 text-center">
        <p className="text-xs text-muted">
          Belum ada data prestasi untuk ekskul ini.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-sm font-extrabold text-ink">
          <Trophy size={14} className="text-brand-green" aria-hidden="true" />
          Prestasi
        </h3>
        <div
          className="flex gap-1 rounded-full bg-cream p-0.5"
          role="group"
          aria-label="Rentang waktu prestasi"
        >
          {(
            [
              { key: "year" as const, label: "1 tahun", count: counts.year },
              { key: "all" as const, label: "Semua", count: counts.all },
            ]
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setRange(option.key);
                setExpanded(false);
              }}
              aria-pressed={range === option.key}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors",
                range === option.key
                  ? "bg-brand-pine text-white"
                  : "text-muted hover:text-ink"
              )}
            >
              {option.label}
              <span className={range === option.key ? "text-white/60" : "text-muted/60"}>
                {" "}
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-2">
        {visible.map((achievement) => (
          <AchievementRow key={achievement.id} achievement={achievement} />
        ))}
      </ul>

      {(hidden > 0 || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs font-semibold text-muted transition-colors hover:border-brand-green/50 hover:text-brand-green"
        >
          {expanded ? "Ringkaskan" : `Tampilkan ${hidden} prestasi lainnya`}
          <ChevronDown
            size={13}
            aria-hidden="true"
            className={cn("transition-transform duration-200", expanded && "rotate-180")}
          />
        </button>
      )}
    </div>
  );
}
