"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { A11yOverlay } from "@/components/ui/A11yOverlay";
import {
  X,
  CheckCircle,
  BookOpen,
  Monitor,
  Globe2,
  Building2,
  Dumbbell,
  UtensilsCrossed,
  Landmark,
  DoorOpen,
  Briefcase,
  Ruler,
  Zap,
  HeartPulse,
  ClipboardList,
  ShoppingBag,
  Shield,
  Presentation,
  Trophy,
  HeartHandshake,
  Microscope,
  Church,
  Package,
  ShowerHead,
  TreePine,
  Flag,
  Mountain,
  ImageOff,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { filterPublicRooms } from "@/lib/fasilitas-publik";
import PageHero from "@/components/ui/PageHero";
import { schoolData } from "@/lib/school-data";
import type { FacilityContent } from "@/lib/content";
import { useContentResource } from "@/lib/use-content";
import { useModalA11y } from "@/lib/useModalA11y";
import { Skeleton } from "@/components/ui/Skeleton";

const FLOORS = ["Lantai 1", "Lantai 2", "Lantai 3", "Lantai 4", "Lantai 5", "Area Outdoor"];

const ROOM_ICONS: Record<string, LucideIcon> = {
  "ruang-kelas": DoorOpen,
  "ruang-kelas-2": DoorOpen,
  "kelas-xi": DoorOpen,
  "ruang-kelas-4": DoorOpen,
  "ruang-kelas-5": DoorOpen,
  "ruang-guru": Briefcase,
  "tata-usaha": Briefcase,
  "wakil-kepala": Briefcase,
  "kepala-sekolah": Landmark,
  uks: HeartPulse,
  piket: ClipboardList,
  koperasi: ShoppingBag,
  "pos-satpam": Shield,
  "gudang-olahraga": Dumbbell,
  "audio-visual": Presentation,
  "galeri-prestasi": Trophy,
  perpustakaan: BookOpen,
  "lab-komputer": Monitor,
  bk: HeartHandshake,
  "lab-biologi": Microscope,
  "agama-kristen": Church,
  "lab-ips": Globe2,
  "ruang-elpala": Package,
  "kamar-mandi": ShowerHead,
  aula: Building2,
  gym: Dumbbell,
  kantin: UtensilsCrossed,
  lapangan: Flag,
  masjid: Landmark,
  "climbing-wall": Mountain,
  kompos: TreePine,
};

const stats = [
  { icon: DoorOpen, value: `${schoolData.sarana.ruangKelas}`, label: "Ruang kelas" },
  { icon: CheckCircle, value: `${schoolData.sarana.ruangKelasLayak}%`, label: "Ruang layak" },
  { icon: BookOpen, value: `${schoolData.sarana.perpustakaan}`, label: "Perpustakaan" },
  { icon: Ruler, value: `${schoolData.sarana.luasTanahM2.toLocaleString("id-ID")} m²`, label: "Luas lahan" },
  { icon: Zap, value: `${schoolData.sarana.dayaListrikVA.toLocaleString("id-ID")} VA`, label: "Daya listrik" },
  { icon: Globe2, value: "Fiber Optic", label: "Jaringan internet" },
];

export default function FasilitasMap() {
  const { data: facilitiesData, loading } = useContentResource<{
    facilities: FacilityContent[];
    highlights: { id: string; title: string; description: string; image: string }[];
  }>("facilities", { facilities: [], highlights: [] });

  const facilities = facilitiesData.facilities;

  const rooms = useMemo(
    () =>
      // Ruangan internal tidak ditampilkan: dipakai untuk keperluan
      // administrasi sekolah, bukan konsumsi publik.
      filterPublicRooms(facilities).map((facility) => ({
        ...facility,
        images: facility.images ?? [],
        icon: ROOM_ICONS[facility.id] ?? BookOpen,
      })),
    [facilities]
  );

  const [activeFloor, setActiveFloor] = useState(FLOORS[0]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const shown = useMemo(() => rooms.filter((room) => room.floor === activeFloor), [rooms, activeFloor]);
  const selected = useMemo(
    () => shown.find((room) => room.id === selectedId) ?? null,
    [shown, selectedId]
  );

  const photos = selected?.images ?? [];

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const modalRef = useModalA11y<HTMLDivElement>(lightboxOpen, closeLightbox);

  const selectFloor = (floor: string) => {
    setActiveFloor(floor);
    setSelectedId(null);
    setPhotoIndex(0);
  };

  const selectRoom = (id: string) => {
    setSelectedId((current) => (current === id ? null : id));
    setPhotoIndex(0);
  };

  const stepPhoto = useCallback(
    (direction: number) => {
      if (photos.length < 2) return;
      setPhotoIndex((current) => (current + direction + photos.length) % photos.length);
    },
    [photos.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") stepPhoto(1);
      if (event.key === "ArrowLeft") stepPhoto(-1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, stepPhoto]);

  const currentPhoto = photos[photoIndex] ?? null;

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Fasilitas & <span className="text-brand-lime">Ruang Sekolah</span>
          </>
        }
        lead="Jelajahi setiap lantai dan ruangan SMAN 68 Jakarta. Klik ruangan untuk melihat galeri fotonya."
      />

      <div className="container-custom py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-4">
                <Icon size={16} className="text-brand-green mb-2.5" aria-hidden="true" />
                <div className="font-display font-extrabold text-lg text-ink leading-none">
                  {stat.value}
                </div>
                <div className="text-xs text-muted mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {loading && rooms.length === 0 ? (
          <div
            className="grid lg:grid-cols-3 gap-8"
            aria-busy="true"
            aria-label="Memuat data fasilitas"
          >
            <div className="lg:col-span-2">
              <div className="card p-4">
                <div className="mb-4 flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20 rounded-full" />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card p-4">
              <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Pilih lantai">
                {FLOORS.map((floor) => (
                  <button
                    key={floor}
                    role="tab"
                    aria-selected={activeFloor === floor}
                    onClick={() => selectFloor(floor)}
                    className={cn("chip", activeFloor === floor && "chip-active")}
                  >
                    {floor}
                  </button>
                ))}
              </div>

              {shown.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">
                  Belum ada data ruangan untuk {activeFloor}.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <AnimatePresence mode="popLayout">
                    {shown.map((room) => {
                      const Icon = room.icon;
                      const isSelected = selected?.id === room.id;
                      const cover = room.images[0];
                      return (
                        <motion.button
                          layout
                          key={room.id}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => selectRoom(room.id)}
                          aria-pressed={isSelected}
                          className={cn(
                            "group h-full overflow-hidden rounded-xl border text-left transition-colors",
                            isSelected
                              ? "bg-brand-pine text-white border-brand-pine"
                              : "bg-brand-mist/60 border-line hover:border-brand-green/50"
                          )}
                        >
                          <span className="relative block aspect-[4/3] overflow-hidden bg-line">
                            {cover ? (
                              <Image
                                src={cover}
                                alt={room.name}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center">
                                <ImageOff size={20} className="text-muted" aria-hidden="true" />
                              </span>
                            )}
                            {room.images.length > 1 && (
                              <span className="absolute right-1.5 top-1.5 rounded-full bg-brand-pine/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                                {room.images.length} foto
                              </span>
                            )}
                          </span>
                          <span className="block p-3">
                            <span className="flex items-start gap-2">
                              <Icon
                                size={14}
                                className={cn(
                                  "mt-0.5 flex-shrink-0",
                                  isSelected ? "text-brand-lime" : "text-brand-green"
                                )}
                                aria-hidden="true"
                              />
                              <span className="block font-semibold text-xs leading-snug sm:text-sm">
                                {room.name}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "mt-1 block text-[11px] capitalize",
                                isSelected ? "text-white/60" : "text-muted"
                              )}
                            >
                              {room.category}
                            </span>
                          </span>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              <p className="text-xs text-muted mt-4">
                Denah bersifat skematik, tata letak ruang menyesuaikan kondisi gedung.
              </p>
            </div>
          </div>

          <div>
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="card p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-brand-green/10 flex items-center justify-center">
                      <selected.icon size={22} className="text-brand-green" aria-hidden="true" />
                    </div>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="btn-icon"
                      aria-label="Tutup detail"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <h2 className="font-display font-extrabold text-xl text-ink mb-2">
                    {selected.name}
                  </h2>
                  <p className="text-muted text-sm leading-relaxed mb-4">{selected.description}</p>

                  {currentPhoto && (
                    <div className="mb-4">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-line">
                        <Image
                          src={currentPhoto}
                          alt={`${selected.name}, foto ${photoIndex + 1}`}
                          fill
                          sizes="(max-width: 1024px) 100vw, 420px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setLightboxOpen(true)}
                          aria-label={`Perbesar foto ${photoIndex + 1}`}
                          className="group absolute inset-0 flex items-end justify-end"
                        >
                          <span className="m-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors group-hover:bg-black/70">
                            <ZoomIn size={15} />
                          </span>
                        </button>
                        {photos.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={() => stepPhoto(-1)}
                              aria-label="Foto sebelumnya"
                              className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => stepPhoto(1)}
                              aria-label="Foto berikutnya"
                              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                            >
                              <ChevronRight size={16} />
                            </button>
                            <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                              {photoIndex + 1}/{photos.length}
                            </span>
                          </>
                        )}
                      </div>

                      {photos.length > 1 && (
                        <div
                          className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          role="tablist"
                          aria-label={`Galeri foto ${selected.name}`}
                        >
                          {photos.map((src, index) => (
                            <button
                              key={`${src}-${index}`}
                              type="button"
                              role="tab"
                              aria-selected={photoIndex === index}
                              onClick={() => setPhotoIndex(index)}
                              aria-label={`Tampilkan foto ${index + 1}`}
                              className={cn(
                                "relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-[border-color,opacity] duration-150 ease-out",
                                photoIndex === index
                                  ? "border-brand-green opacity-100"
                                  : "border-transparent opacity-60 hover:opacity-100"
                              )}
                            >
                              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-cream rounded-lg p-3">
                      <div className="text-xs text-muted">Foto</div>
                      <div className="font-semibold text-ink text-sm mt-0.5">
                        {photos.length > 0 ? `${photos.length} foto` : "Belum ada"}
                      </div>
                    </div>
                    <div className="bg-cream rounded-lg p-3">
                      <div className="text-xs text-muted">Lokasi</div>
                      <div className="font-semibold text-ink text-sm mt-0.5">{selected.floor}</div>
                    </div>
                    <div className="bg-cream rounded-lg p-3">
                      <div className="text-xs text-muted">Kondisi</div>
                      <div className="font-semibold text-brand-green text-sm mt-0.5 flex items-center gap-1">
                        <CheckCircle size={12} aria-hidden="true" /> Baik
                      </div>
                    </div>
                    <div className="bg-brand-mist rounded-lg p-3">
                      <div className="text-xs text-muted">Sumber</div>
                      <div className="font-semibold text-ink text-sm mt-0.5">Dokumentasi Sekolah</div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  <h2 className="font-display font-bold text-lg text-ink mb-1">{activeFloor}</h2>
                  <div className="text-muted text-sm mb-4">
                    {loading && shown.length === 0 ? (
                      <Skeleton className="h-4 w-64" />
                    ) : (
                      `${shown.length} ruangan pada lantai ini. Klik ruangan untuk melihat galeri fotonya.`
                    )}
                  </div>
                  {shown.map((room) => {
                    const Icon = room.icon;
                    const cover = room.images[0];
                    return (
                      <button
                        key={room.id}
                        onClick={() => selectRoom(room.id)}
                        className="w-full card p-3 flex items-center gap-3 text-left"
                      >
                        <span className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-brand-green/10">
                          {cover ? (
                            <Image src={cover} alt="" fill sizes="44px" className="object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center">
                              <Icon size={16} className="text-brand-green" aria-hidden="true" />
                            </span>
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold text-ink text-sm">{room.name}</span>
                          <span className="block text-xs text-muted mt-0.5 capitalize">
                            {room.category}
                            {room.images.length > 1 ? ` · ${room.images.length} foto` : ""}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        )}
      </div>

      <A11yOverlay>
        <AnimatePresence>
          {lightboxOpen && selected && currentPhoto && (
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
                aria-label={`Foto ${selected.name}`}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.2 }}
                onClick={(event) => event.stopPropagation()}
                className="relative flex w-full max-w-5xl flex-col focus:outline-none"
              >
                <div className="relative h-[62vh] w-full overflow-hidden rounded-xl md:h-[72vh]">
                  <Image
                    src={currentPhoto}
                    alt={`${selected.name}, foto ${photoIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />

                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() => stepPhoto(-1)}
                        aria-label="Foto sebelumnya"
                        className="absolute left-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 md:left-4"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => stepPhoto(1)}
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
                  <p className="text-sm text-white/80">
                    {selected.name}
                    {photos.length > 1 ? `, foto ${photoIndex + 1} dari ${photos.length}` : ""}
                  </p>
                  <span className="shrink-0 text-xs tabular-nums text-white/50">
                    {selected.floor}
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
