"use client";

import { Play, Layers, ExternalLink } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { InstagramFeed, InstagramPost } from "@/lib/instagram-feed";
import SectionHeader from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";

// Mode widget pihak ketiga (SnapWidget/LightWidget) — tanpa API/scrape sama sekali.
const EMBED_URL = process.env.NEXT_PUBLIC_INSTAGRAM_EMBED_URL;
const EMBED_USERNAME = process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || "smanegeri68jakarta";
const EMBED_HEIGHT = (() => {
  const parsed = Number(process.env.NEXT_PUBLIC_INSTAGRAM_EMBED_HEIGHT);
  return Number.isFinite(parsed) && parsed >= 240 ? Math.min(parsed, 1200) : 560;
})();

function InstagramGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
    </svg>
  );
}

/** Bersihkan caption: buang URL, hashtag, dan mention agar rapi dibaca. */
function cleanCaption(value: string): string {
  return value
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[#@][A-Za-z0-9_.]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const postDate = (iso: string) =>
  iso ? formatDate(iso, { day: "numeric", month: "short", year: "numeric" }) : "";

function MarqueeCard({ post }: { post: InstagramPost }) {
  const caption = cleanCaption(post.caption);

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      aria-label={`Buka postingan Instagram: ${caption || "Postingan SMAN 68 Jakarta"}`}
      className="group flex w-[80vw] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-pine/25 sm:w-[360px] sm:flex-row md:w-[440px] lg:w-[556px]"
    >
      <span
        className="relative block h-52 w-full flex-shrink-0 overflow-hidden sm:h-auto sm:w-[42%]"
        style={{ backgroundColor: post.dominantColor }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.thumb || post.image}
          alt={post.alt || caption || "Postingan Instagram SMAN 68 Jakarta"}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105"
        />

        {post.mediaType !== "IMAGE" && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {post.mediaType === "VIDEO" ? <Play size={11} /> : <Layers size={11} />}
            {post.mediaType === "VIDEO" ? (post.isReel ? "Reel" : "Video") : "Album"}
          </span>
        )}
      </span>

      {/* Caption di luar gambar agar foto tidak tertutup */}
      <span className="flex min-w-0 flex-1 flex-col p-4">
        {caption && (
          <span className="line-clamp-3 block text-[13px] font-medium leading-snug text-ink sm:text-sm">
            {caption}
          </span>
        )}
        <span
          className={cn(
            "flex items-center gap-2 text-[11px] text-muted",
            caption ? "mt-auto pt-3" : "mt-auto"
          )}
        >
          <span>{postDate(post.timestamp)}</span>
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-green opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            Instagram
            <ExternalLink size={11} aria-hidden="true" />
          </span>
        </span>
      </span>
    </a>
  );
}

type InstagramHighlightProps = {
  feed: InstagramFeed | null;
  loading?: boolean;
};

export default function InstagramHighlight({ feed, loading = false }: InstagramHighlightProps) {
  const posts = feed?.posts ?? [];
  const count = posts.length;

  const username = feed?.username || EMBED_USERNAME;
  const header = (
    <SectionHeader
      eyebrow="Media Sosial Resmi"
      title={
        <>
          Kegiatan Sekolah <span className="text-brand-leaf">di Instagram</span>
        </>
      }
      lead={`Cuplikan kegiatan & prestasi terbaru dari akun resmi @${username}.`}
      action={
        <a
          href={`https://www.instagram.com/${username}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost inline-flex"
        >
          <InstagramGlyph size={15} />
          Ikuti @{username}
        </a>
      }
      className="mb-6 md:mb-8"
    />
  );

  if (EMBED_URL) {
    return (
      <section className="mb-10" aria-label="Kegiatan sekolah di Instagram SMAN 68 Jakarta">
        {header}
        <div className="overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-sm sm:p-3">
          <iframe
            src={EMBED_URL}
            title={`Feed Instagram @${EMBED_USERNAME}`}
            loading="lazy"
            style={{ height: EMBED_HEIGHT }}
            className="w-full rounded-xl border-0"
          />
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section
        className="mb-10"
        aria-label="Kegiatan sekolah di Instagram SMAN 68 Jakarta"
        aria-busy="true"
      >
        <div className="mb-6 md:mb-8">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-8 w-64 max-w-full" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-brand-leaf/25 bg-brand-pine p-3 sm:p-5">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-2 sm:p-3">
            <div className="flex gap-4" aria-hidden="true">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex w-[80vw] flex-shrink-0 flex-col overflow-hidden rounded-2xl sm:w-[360px] sm:flex-row md:w-[440px] lg:w-[556px]",
                    index % 2 === 0 ? "bg-white/10" : "bg-white/[0.07]"
                  )}
                >
                  <div className="h-40 w-full animate-pulse bg-white/[0.06] sm:h-auto sm:w-[42%]" />
                  <div className="flex-1 space-y-2 p-4">
                    <div className="h-3 w-full rounded bg-white/10" />
                    <div className="h-3 w-5/6 rounded bg-white/10" />
                    <div className="h-3 w-2/3 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <span className="sr-only">Memuat postingan Instagram…</span>
      </section>
    );
  }

  if (!feed || count === 0) return null;

  return (
    <section className="mb-10" aria-label="Kegiatan sekolah di Instagram SMAN 68 Jakarta">
      {header}

      <div className="relative overflow-hidden rounded-3xl border border-brand-leaf/25 bg-brand-pine p-3 shadow-xl shadow-brand-pine/20 sm:p-5">
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-green/25 via-transparent to-brand-leaf/10" />
          <div className="absolute inset-0 pattern-dots opacity-70" />
          <div className="animate-drift motion-reduce:animate-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-leaf/15 blur-3xl" />
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-brand-lime/50 to-transparent" />
        </div>

        <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] p-2 sm:p-3">
          <div className="marquee relative overflow-hidden py-1 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div className="marquee-track flex w-max" style={{ animationDuration: "60s" }}>
              {[0, 1].map((copy) => (
                <div
                  key={copy}
                  className="flex gap-4 pr-4"
                  aria-hidden={copy === 1 ? "true" : undefined}
                >
                  {posts.map((post) => (
                    <MarqueeCard key={`${copy}-${post.id}`} post={post} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
