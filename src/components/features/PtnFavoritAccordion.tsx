"use client";

/*
 * Accordion PTN Favorit (client island).
 * Hanya bagian ini yang butuh state; hero + catatan data tetap server-rendered.
 * - Tampilan ringkas: peringkat, logo, nama, satu kalimat pendek.
 * - Ditekan: kartu membesar (height accordion + layout sibling) dan menampilkan detail.
 * - Motion: height 280ms kurva --ease-out (accordion = pengecualian layout yang
 *   dibenarkan), opacity 200ms, chevron rotate 200ms.
 *   prefers-reduced-motion: tanpa height/layout, hanya fade singkat.
 * - PtnItem di-memo agar membuka satu kartu tidak me-render ulang 9 kartu lain.
 */

import { memo, useCallback, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import { PTN_FAVORIT, alumniUrlFor, type PtnFavorit } from "@/lib/ptn-favorit";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const LINK_PRIMARY =
  "inline-flex items-center gap-1.5 min-h-11 px-4 rounded-lg bg-brand-green text-white text-xs font-bold transition-[transform,background-color] duration-150 hover:bg-brand-green-deep active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const LINK_SECONDARY =
  "inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-lg border border-line text-ink text-xs font-semibold transition-[transform,border-color,color] duration-150 hover:border-brand-green hover:text-brand-green active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const pad = (n: number) => String(n).padStart(2, "0");

function LogoTile({ ptn }: { ptn: PtnFavorit }) {
  return (
    <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-line flex items-center justify-center overflow-hidden flex-shrink-0 px-1.5">
      {ptn.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ptn.logo}
          alt={`Logo ${ptn.nama}`}
          loading="lazy"
          className="max-h-7 sm:max-h-8 w-full object-contain"
        />
      ) : (
        <span className="font-display font-extrabold text-brand-pine text-[11px]" aria-hidden="true">
          {ptn.singkat}
        </span>
      )}
    </span>
  );
}

const PtnItem = memo(function PtnItem({
  ptn,
  open,
  reduce,
  onToggle,
}: {
  ptn: PtnFavorit;
  open: boolean;
  reduce: boolean | null;
  onToggle: (slug: string) => void;
}) {
  const panelId = `ptn-${ptn.slug}-detail`;

  return (
    <motion.div
      layout={!reduce}
      transition={{ layout: { duration: 0.28, ease: EASE } }}
      className={cn(
        "rounded-2xl border bg-white overflow-hidden",
        open ? "border-brand-green/40 shadow-card-hover" : "border-line shadow-card"
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(ptn.slug)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full min-h-[72px] flex items-center gap-3.5 p-4 sm:p-5 text-left transition-[transform,background-color] duration-150 hover:bg-cream/70 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 focus-visible:ring-inset"
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      >
        <span
          aria-hidden="true"
          className="font-display font-extrabold text-2xl leading-none text-brand-green/30 tabular-nums w-8 flex-shrink-0 select-none"
        >
          {pad(ptn.rank)}
        </span>

        <LogoTile ptn={ptn} />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display font-bold text-[15px] sm:text-base text-ink leading-tight">
              {ptn.nama}
            </span>
            {ptn.rank === 1 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-lime/90 text-brand-pine px-2 py-0.5 text-[10px] font-bold">
                <Trophy size={10} aria-hidden="true" />
                Terfavorit
              </span>
            )}
          </span>
          <span className="block text-xs text-muted mt-0.5 truncate">{ptn.tagline}</span>
        </span>

        <ChevronDown
          size={18}
          aria-hidden="true"
          className={cn(
            "flex-shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180"
          )}
          style={{ transitionTimingFunction: "var(--ease-out)" }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reduce
                ? { duration: 0.15 }
                : {
                    height: { duration: 0.28, ease: EASE },
                    opacity: { duration: 0.2, ease: "easeOut" },
                  }
            }
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5">
              <div className="border-t border-line pt-4">
                <p className="text-xs text-muted flex items-center gap-1.5">
                  <MapPin size={12} aria-hidden="true" />
                  {ptn.kota}, {ptn.provinsi}
                </p>
                <p className="text-sm text-muted leading-relaxed mt-2.5">{ptn.tentang}</p>

                <p className="text-xs font-semibold text-brand-green mt-4 mb-1.5">
                  Program unggulan
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ptn.unggulan.map((u) => (
                    <span
                      key={u}
                      className="rounded-full bg-brand-green/10 text-brand-green px-2.5 py-1 text-[11px] font-semibold"
                    >
                      {u}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href={alumniUrlFor(ptn.nama)} className={LINK_PRIMARY}>
                    <Users size={13} aria-hidden="true" />
                    Alumni kampus ini
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                  <a
                    href={ptn.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={LINK_SECONDARY}
                  >
                    Web resmi
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                  <a
                    href={ptn.admisi.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={LINK_SECONDARY}
                  >
                    {ptn.admisi.label}
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default function PtnFavoritAccordion() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const toggle = useCallback((slug: string) => {
    setOpenSlug((prev) => (prev === slug ? null : slug));
  }, []);

  return (
    <ul className="grid grid-cols-1 lg:grid-cols-2 items-start gap-3 sm:gap-4">
      {PTN_FAVORIT.map((ptn, i) => (
        <li key={ptn.slug} id={ptn.slug} className="scroll-mt-28">
          <Reveal delay={Math.min(i * 0.04, 0.2)}>
            <PtnItem ptn={ptn} open={openSlug === ptn.slug} onToggle={toggle} reduce={reduce} />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
