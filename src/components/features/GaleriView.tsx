"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { A11yOverlay } from "@/components/ui/A11yOverlay";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { GalleryAlbumContent, GalleryPhotoContent } from "@/lib/content";
import { useContentResource } from "@/lib/use-content";
import { useModalA11y } from "@/lib/useModalA11y";
import { cn } from "@/lib/utils";
import PageHero from "@/components/ui/PageHero";
import SectionHeader from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";

type GalleryPhoto = {
  id: string;
  src: string;
  caption: string;
  album?: string;
};

type LightboxState = { photos: GalleryPhoto[]; index: number };

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
  return groups;
}

function ArrowButton({
  direction,
  onClick,
  disabled,
  label,
}: {
  direction: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors duration-150 hover:border-brand-green hover:text-brand-green disabled:pointer-events-none disabled:opacity-35"
    >
      {direction === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}

export default function GaleriView({
  initialGallery,
}: {
  initialGallery: { albums: GalleryAlbumContent[]; photos: GalleryPhotoContent[] };
}) {
  const { data: gallery, loading } = useContentResource<{
    albums: GalleryAlbumContent[];
    photos: GalleryPhotoContent[];
  }>("gallery", { albums: [], photos: [] }, initialGallery);

  const albums = useMemo(
    () => gallery.albums.map((album) => ({ id: album.id, name: album.title })),
    [gallery.albums]
  );

  const photos: GalleryPhoto[] = useMemo(
    () =>
      gallery.photos.map((photo) => ({
        id: photo.id,
        src: photo.src,
        caption: photo.caption,
        album: photo.albumId,
      })),
    [gallery.photos]
  );

  const [activeAlbum, setActiveAlbum] = useState<string | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [perView, setPerView] = useState(3);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const stripRef = useRef<HTMLDivElement>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const modalRef = useModalA11y<HTMLDivElement>(!!lightbox, closeLightbox);

  const spotlight = photos.find((photo) => photo.id === spotlightId) ?? photos[0] ?? null;

  const highlights = useMemo(() => photos.slice(0, 14), [photos]);

  const slides = useMemo(() => chunk(photos, perView), [photos, perView]);
  const maxSlide = Math.max(0, slides.length - 1);

  const archive = useMemo(
    () => (activeAlbum ? photos.filter((photo) => photo.album === activeAlbum) : photos),
    [activeAlbum, photos]
  );

  useEffect(() => {
    const compute = () => {
      const width = window.innerWidth;
      setPerView(width >= 1024 ? 3 : width >= 640 ? 2 : 1);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    setSlide((current) => Math.min(current, maxSlide));
  }, [maxSlide]);

  const openLightbox = useCallback((list: GalleryPhoto[], index: number) => {
    setLightbox({ photos: list, index });
  }, []);

  const stepLightbox = useCallback((direction: number) => {
    setLightbox((current) => {
      if (!current || current.photos.length < 2) return current;
      const next =
        (current.index + direction + current.photos.length) % current.photos.length;
      return { ...current, index: next };
    });
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") stepLightbox(1);
      if (event.key === "ArrowLeft") stepLightbox(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox, stepLightbox]);

  const scrollStrip = (direction: number) => {
    const node = stripRef.current;
    if (!node) return;
    node.scrollBy({ left: direction * node.clientWidth * 0.85, behavior: "smooth" });
  };

  const activePhoto = lightbox ? lightbox.photos[lightbox.index] ?? null : null;
  const spotlightAlbum = albums.find((album) => album.id === spotlight?.album)?.name;

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Momen Terbaik <span className="text-brand-lime">SMAN 68</span>
          </>
        }
        lead="Koleksi foto kegiatan, prestasi, dan kehidupan sekolah SMAN 68 Jakarta."
      />

      <div className="container-custom space-y-14 py-12 md:space-y-20 md:py-16">
        {loading && photos.length === 0 && (
          <div className="columns-2 gap-3 sm:columns-3 md:gap-4 xl:columns-4" aria-busy="true" aria-live="polite">
            <span className="sr-only">Memuat galeri...</span>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mb-3 h-52 animate-pulse rounded-2xl bg-line/70 md:mb-4" />
            ))}
          </div>
        )}
        {photos.length === 0 ? (
          loading ? null : (
          <EmptyState
            icon="🖼️"
            title="Belum ada foto"
            description="Koleksi galeri masih kosong. Silakan cek kembali nanti."
          />
          )
        ) : (
          <>
            {/* 1. Spotlight — satu foto besar */}
            {spotlight && (
              <section aria-label="Sorotan galeri">
                <SectionHeader
                  eyebrow="Sorotan"
                  title={
                    <>
                      Sedang <span className="text-brand-leaf">Disorot</span>
                    </>
                  }
                  lead="Pilih foto dari daftar di bawah untuk menampilkannya dalam ukuran besar."
                  className="mb-6 md:mb-8"
                />

                <button
                  type="button"
                  onClick={() => openLightbox(photos, photos.findIndex((p) => p.id === spotlight.id))}
                  className="group relative block aspect-[16/9] w-full overflow-hidden rounded-3xl bg-line text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
                >
                  <Image
                    src={spotlight.src}
                    alt={spotlight.caption}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1200px"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-brand-pine/85 via-brand-pine/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-5 md:p-8">
                    <span className="badge bg-brand-lime text-brand-pine">
                      {spotlightAlbum ?? "Galeri"}
                    </span>
                    <span className="mt-3 block font-display text-xl font-bold text-white md:text-3xl">
                      {spotlight.caption}
                    </span>
                    <span className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
                      <ZoomIn size={13} />
                      Klik untuk memperbesar
                    </span>
                  </span>
                </button>

                {/* Pemilih foto spotlight */}
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setSpotlightId(photo.id)}
                      aria-label={`Tampilkan ${photo.caption}`}
                      className={cn(
                        "relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150",
                        spotlight.id === photo.id
                          ? "border-brand-green opacity-100"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <Image
                        src={photo.src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 2. Geser kiri-kanan */}
            <section aria-label="Momen pilihan">
              <SectionHeader
                eyebrow="Momen Pilihan"
                title={
                  <>
                    Geser untuk <span className="text-brand-leaf">Menjelajah</span>
                  </>
                }
                lead="Deretan momen favorit — geser ke kanan atau kiri untuk melihat semuanya."
                action={
                  <div className="flex gap-2">
                    <ArrowButton direction="left" onClick={() => scrollStrip(-1)} label="Geser ke kiri" />
                    <ArrowButton direction="right" onClick={() => scrollStrip(1)} label="Geser ke kanan" />
                  </div>
                }
                className="mb-6"
              />

              <div
                ref={stripRef}
                className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {highlights.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => openLightbox(photos, index)}
                    className="group relative h-40 flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-line sm:h-52 lg:h-64"
                  >
                    <Image
                      src={photo.src}
                      alt={photo.caption}
                      width={0}
                      height={0}
                      sizes="(max-width: 640px) 60vw, 33vw"
                      style={{ height: "100%", width: "auto" }}
                      className="transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-brand-pine/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="absolute inset-x-0 bottom-0 p-3 text-left text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {photo.caption}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* 3. Carousel isi tiga */}
            <section aria-label="Jelajah foto">
              <SectionHeader
                eyebrow="Jelajah Foto"
                title={
                  <>
                    Tiga Momen <span className="text-brand-leaf">Sekaligus</span>
                  </>
                }
                lead="Gunakan panah untuk berpindah kelompok foto."
                action={
                  <div className="flex items-center gap-3">
                    <span className="text-xs tabular-nums text-muted">
                      {slide + 1} / {slides.length}
                    </span>
                    <div className="flex gap-2">
                      <ArrowButton
                        direction="left"
                        onClick={() => setSlide((current) => Math.max(0, current - 1))}
                        disabled={slide === 0}
                        label="Kelompok sebelumnya"
                      />
                      <ArrowButton
                        direction="right"
                        onClick={() => setSlide((current) => Math.min(maxSlide, current + 1))}
                        disabled={slide === maxSlide}
                        label="Kelompok berikutnya"
                      />
                    </div>
                  </div>
                }
                className="mb-6"
              />

              <div className="overflow-hidden">
                <motion.div
                  className="flex"
                  animate={{ x: `${-slide * 100}%` }}
                  transition={{ type: "spring", stiffness: 260, damping: 32 }}
                >
                  {slides.map((group, groupIndex) => (
                    <div key={groupIndex} className="w-full flex-shrink-0 pr-3 last:pr-0">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.map((photo, index) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => openLightbox(group, index)}
                            className="group relative block w-full overflow-hidden rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
                          >
                            <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-brand-pine">
                              <Image
                                src={photo.src}
                                alt=""
                                aria-hidden
                                fill
                                className="scale-110 object-cover opacity-50 blur-lg"
                                sizes="(max-width: 640px) 100vw, 33vw"
                              />
                              <Image
                                src={photo.src}
                                alt={photo.caption}
                                fill
                                className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
                                sizes="(max-width: 640px) 100vw, 33vw"
                              />
                              <span className="absolute inset-0 bg-gradient-to-t from-brand-pine/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                              <span className="absolute inset-x-0 bottom-0 p-3 text-xs font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                {photo.caption}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {slides.length > 1 && (
                <div className="mt-5 flex items-center justify-center gap-1.5">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSlide(index)}
                      aria-label={`Ke kelompok ${index + 1}`}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-200",
                        index === slide ? "w-6 bg-brand-green" : "w-1.5 bg-ink/15 hover:bg-ink/30"
                      )}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* 4. Arsip semua foto */}
            <section aria-label="Semua foto">
              <SectionHeader
                eyebrow="Arsip"
                title={
                  <>
                    Semua <span className="text-brand-leaf">Foto</span>
                  </>
                }
                lead="Telusuri seluruh koleksi berdasarkan album."
                className="mb-6"
              />

              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveAlbum(null)}
                  className={cn("chip", !activeAlbum && "chip-active")}
                >
                  Semua Foto
                </button>
                {albums.map((album) => (
                  <button
                    key={album.id}
                    type="button"
                    onClick={() => setActiveAlbum(album.id)}
                    className={cn("chip", activeAlbum === album.id && "chip-active")}
                  >
                    {album.name}
                  </button>
                ))}
              </div>

              {archive.length === 0 ? (
                <EmptyState
                  icon="🖼️"
                  title="Belum ada foto di album ini"
                  description="Koleksi album ini masih kosong. Lihat semua foto dulu, ya."
                  action={{ label: "Lihat Semua Foto", onClick: () => setActiveAlbum(null) }}
                />
              ) : (
                <div
                  key={activeAlbum ?? "all"}
                  className="columns-2 gap-3 sm:columns-3 md:gap-4 xl:columns-4"
                >
                  {archive.map((photo, index) => (
                    <motion.button
                      key={photo.id}
                      type="button"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
                      onClick={() => openLightbox(archive, index)}
                      aria-label={`Perbesar foto: ${photo.caption || "Galeri SMAN 68"}`}
                      className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-line text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 md:mb-4"
                    >
                      <span className="relative block overflow-hidden">
                        <Image
                          src={photo.src}
                          alt={photo.caption}
                          width={0}
                          height={0}
                          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="block transition-transform duration-500 group-hover:scale-[1.04]"
                          style={{ width: "100%", height: "auto" }}
                        />
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-pine/85 via-brand-pine/10 to-transparent opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100" />
                        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
                          <span className="line-clamp-2 text-xs font-medium leading-snug text-white">
                            {photo.caption}
                          </span>
                          <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm md:flex">
                            <ZoomIn size={14} />
                          </span>
                        </span>
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Lightbox */}
      <A11yOverlay>
        <AnimatePresence>
          {activePhoto && lightbox && (
            <div
              className="a11y-layer fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
              onClick={closeLightbox}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90"
              />
              <motion.div
                ref={modalRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={activePhoto.caption || "Pratinjau foto"}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.2 }}
                onClick={(event) => event.stopPropagation()}
                className="relative flex w-full max-w-5xl flex-col focus:outline-none"
              >
                <div className="relative h-[62vh] w-full overflow-hidden rounded-xl md:h-[72vh]">
                  <Image
                    src={activePhoto.src}
                    alt={activePhoto.caption}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />

                  {lightbox.photos.length > 1 && (
                    <>
                      <button
                        onClick={() => stepLightbox(-1)}
                        aria-label="Foto sebelumnya"
                        className="absolute left-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 md:left-4"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => stepLightbox(1)}
                        aria-label="Foto berikutnya"
                        className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 md:right-4"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  <button
                    onClick={closeLightbox}
                    aria-label="Tutup"
                    className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-3 flex items-start justify-between gap-4">
                  <p className="text-sm text-white/80">{activePhoto.caption}</p>
                  <span className="shrink-0 text-xs tabular-nums text-white/50">
                    {lightbox.index + 1} / {lightbox.photos.length}
                  </span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </A11yOverlay>
    </div>
  );
}
