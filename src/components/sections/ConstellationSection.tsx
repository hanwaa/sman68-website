"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { categoryColorFor, type Ekskul } from "@/lib/ekskul";
import { useContent } from "@/lib/use-content";

type Ring = {
  id: string;
  radius: number;
  duration: number;
  direction: 1 | -1;
  baseAngle: number;
  items: Ekskul[];
};

const CX = 400;
const CY = 400;
const VIEW = 800;

const RING_SIZES = [6, 5, 5, 5, 5];
/** Radius saat konstelasi tertutup. */
const RING_RADII = [95, 150, 205, 260, 315];
/**
 * Radius saat detail ekskul terbuka: tiap cincin terdorong ke luar memberi
 * ruang untuk panel detail di tengah (menggantikan logo sekolah).
 */
const RING_RADII_OPEN = [140, 190, 238, 286, 334];
const RING_DURATIONS = [48, 64, 80, 96, 112];
const RING_ANGLES = [0, 22, 48, 12, 36];

/** Jari-jari panel detail di tengah, dalam satuan viewBox. */
const DETAIL_RADIUS = 104;

function initials(name: string) {
  const words = name.split(" ");
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** SVG <text> tidak bisa wrap, jadi nama panjang dipotong dengan elipsis. */
function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export default function ConstellationSection() {
  const ekskulList = useContent<Ekskul[]>("ekskul", []);

  const rings = useMemo<Ring[]>(() => {
    const result: Ring[] = [];
    let index = 0;
    RING_SIZES.forEach((size, i) => {
      result.push({
        id: `ring-${i}`,
        radius: RING_RADII[i],
        duration: RING_DURATIONS[i],
        direction: i % 2 === 0 ? 1 : -1,
        baseAngle: RING_ANGLES[i],
        items: ekskulList.slice(index, index + size),
      });
      index += size;
    });
    return result;
  }, [ekskulList]);

  const TOTAL = ekskulList.length;

  const [selected, setSelected] = useState<Ekskul | null>(null);

  /**
   * Cincin melebar saat detail terbuka. `radiiRef` dipakai rAF untuk
   * memindahkan planet, `ringRadii` untuk menggambar garis pandu; keduanya
   * harus diinterpolasi bersama agar cincin dan planet tidak terpisah.
   */
  const radiiRef = useRef<number[]>(RING_RADII);
  const [ringRadii, setRingRadii] = useState<number[]>(RING_RADII);

  useEffect(() => {
    const from = radiiRef.current.slice();
    const to = selected ? RING_RADII_OPEN : RING_RADII;
    if (from.every((value, i) => value === to[i])) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      radiiRef.current = to.slice();
      setRingRadii(to.slice());
      return;
    }

    const started = performance.now();
    const DURATION = 420;
    let raf = 0;

    const step = (now: number) => {
      const t = Math.min((now - started) / DURATION, 1);
      // easeOutCubic
      const eased = 1 - (1 - t) ** 3;
      const next = from.map((value, i) => value + (to[i] - value) * eased);
      radiiRef.current = next;
      setRingRadii(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [selected]);

  const positionAt = (ri: number, ii: number) => {
    const ring = rings[ri];
    const a = ((ring.baseAngle + (ii * 360) / ring.items.length) * Math.PI) / 180;
    const radius = radiiRef.current[ri];
    return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
  };

  const mapRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const [hovered, setHovered] = useState<Ekskul | null>(null);
  const router = useRouter();
  const a11yPauseRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sman68_a11y_prefs");
      if (raw && JSON.parse(raw).reduceMotion) a11yPauseRef.current = true;
    } catch {
      /* abaikan */
    }
    const handler = (e: Event) => {
      a11yPauseRef.current = Boolean((e as CustomEvent).detail?.enabled);
    };
    window.addEventListener("sman68:reduced-motion", handler);
    return () => window.removeEventListener("sman68:reduced-motion", handler);
  }, []);

  /** Klik planet -> buka pop up lingkaran. Klik pop up -> langsung ke halaman ekskul. */
  const selectEkskul = (item: Ekskul) => {
    setSelected((current) => (current?.id === item.id ? null : item));
  };

  const openEkskul = (item: Ekskul) => {
    setSelected(null);
    router.push(`/kehidupan/ekskul?ekskul=${item.id}`);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const angles = rings.map(() => 0);
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!last) {
        last = now;
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Tidak ada jeda karena hover atau saat di luar layar: orbit harus
      // berputar terus. Hanya preferensi reduced-motion yang menghentikannya.
      if (a11yPauseRef.current) return;

      let index = 0;
      rings.forEach((ring, ri) => {
        angles[ri] = (angles[ri] + dt * (360 / ring.duration) * ring.direction) % 360;
        const step = 360 / ring.items.length;
        const radius = radiiRef.current[ri];
        ring.items.forEach((_, ii) => {
          const a = ((ring.baseAngle + angles[ri] + ii * step) * Math.PI) / 180;
          const x = CX + radius * Math.cos(a);
          const y = CY + radius * Math.sin(a);
          const node = groupRefs.current[index];
          if (node) node.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
          index++;
        });
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rings]);

  return (
    <section
      className="bg-brand-pine overflow-hidden pt-20 pb-6 md:pt-[6.5rem] md:pb-6 flex flex-col"
      style={{ minHeight: "100svh" }}
      aria-label="Ekskul & Organisasi"
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-3 shrink-0"
        >
          <h2 className="font-display font-extrabold uppercase text-white text-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.16em]">
            Ekstrakurikuler
          </h2>
          <span
            className="block w-14 h-0.5 bg-brand-lime mx-auto mt-3"
            aria-hidden="true"
          />
          <p className="mt-2 text-sm text-white/60">
            Klik salah satu ekskul untuk melihat ringkasannya
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex-1 min-h-0 flex items-center justify-center"
        >
          <div
            ref={mapRef}
            // Orbit memakai sisa tinggi layar: 92vw di layar sempit (HP),
            // calc(100svh - 286px) di layar lebar, dibatasi 620px agar tidak
            // berlebihan di monitor tinggi. 286px = navbar (104) + judul (~107)
            // + tombol (~44) + padding bawah (24) + margin aman.
            // Dengan begitu bagian ini selalu pas satu layar tanpa scroll.
            className="orbit-map relative mx-auto aspect-square w-[min(92vw,calc(100svh-286px))] max-w-[620px]"
          >
            <svg
              viewBox={`0 0 ${VIEW} ${VIEW}`}
              className="w-full h-auto"
              role="group"
              aria-label={`Peta orbit ${TOTAL} ekskul SMAN 68 Jakarta`}
            >
              <defs>
                <clipPath id="orbit-planet-clip">
                  <circle cx="0" cy="0" r="15" />
                </clipPath>
                <clipPath id="orbit-logo-clip">
                  <circle cx={CX} cy={CY} r={28} />
                </clipPath>
                <clipPath id="orbit-detail-clip">
                  <circle cx={0} cy={0} r={18} />
                </clipPath>
              </defs>

              {rings.map((ring, ri) => (
                <circle
                  key={ring.id}
                  cx={CX}
                  cy={CY}
                  r={ringRadii[ri]}
                  fill="none"
                  stroke="white"
                  strokeOpacity={0.09}
                  strokeWidth={1}
                />
              ))}

              {/* Logo sekolah hanya saat konstelasi tertutup; saat detail
                  terbuka, panel detail yang mengisi posisi tengah ini. */}
              {!selected && (
                <>
                  <circle cx={CX} cy={CY} r={54} fill="#04424C" stroke="#FFFF00" strokeOpacity={0.4} strokeWidth={1.5} />
                  {hovered?.thumb && <circle cx={CX} cy={CY} r={28} fill="#ffffff" />}
                  <image
                    href={hovered?.thumb ?? "/assets/logo.png"}
                    x={CX - 28}
                    y={CY - 28}
                    width={56}
                    height={56}
                    preserveAspectRatio="xMidYMid meet"
                    clipPath="url(#orbit-logo-clip)"
                  />
                </>
              )}

              {rings.map((ring, ri) => (
                <g key={ring.id}>
                  {ring.items.map((item, ii) => {
                    const index =
                      rings.slice(0, ri).reduce((n, r) => n + r.items.length, 0) + ii;
                    const start = positionAt(ri, ii);
                    const { color } = categoryColorFor(item.category);
                    return (
                      <g
                        key={item.id}
                        transform={`translate(${start.x.toFixed(2)} ${start.y.toFixed(2)})`}
                        ref={(el) => {
                          groupRefs.current[index] = el;
                        }}
                        className="orbit-planet"
                        tabIndex={0}
                        role="link"
                        aria-label={`${item.name} — ${item.category}. Lihat ringkasan ekskul`}
                        onMouseEnter={() => setHovered(item)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(item)}
                        onBlur={() => setHovered(null)}
                        onClick={() => selectEkskul(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectEkskul(item);
                          }
                        }}
                      >
                        <title>{`${item.name} — ${item.category}`}</title>
                        <circle className="planet-glow" r={24} fill={color} opacity={0.16} />
                        <circle r={16} fill="#ffffff" />
                        {item.thumb ? (
                          <image
                            href={item.thumb}
                            x={-14}
                            y={-14}
                            width={28}
                            height={28}
                            preserveAspectRatio="xMidYMid meet"
                            clipPath="url(#orbit-planet-clip)"
                          />
                        ) : (
                          <text
                            y={4.5}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="800"
                            fill={color}
                            fontFamily="var(--font-serif)"
                          >
                            {initials(item.name)}
                          </text>
                        )}
                        <circle
                          className="planet-core"
                          r={15}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                        />
                      </g>
                    );
                  })}
                </g>
              ))}
              {/* Panel detail di tengah, menggantikan logo sekolah.
                  Diklik -> langsung ke halaman ekskul. */}
              <AnimatePresence>
                {selected && (
                  <motion.g
                    key={selected.id}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.26, ease: "easeOut" }}
                    style={{ transformOrigin: `${CX}px ${CY}px` }}
                    onClick={() => openEkskul(selected)}
                    role="link"
                    tabIndex={0}
                    aria-label={`Buka halaman ${selected.name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openEkskul(selected);
                      }
                    }}
                    className="cursor-pointer focus:outline-none"
                  >
                    <circle
                      cx={CX}
                      cy={CY}
                      r={DETAIL_RADIUS}
                      fill="#062A31"
                      stroke={categoryColorFor(selected.category).color}
                      strokeWidth={2}
                    />
                    <circle
                      cx={CX}
                      cy={CY}
                      r={DETAIL_RADIUS - 8}
                      fill="none"
                      stroke="white"
                      strokeOpacity={0.16}
                      strokeDasharray="5 7"
                    />
                    {selected.thumb ? (
                      <>
                        <circle cx={CX} cy={CY - 48} r={22} fill="#ffffff" />
                        <image
                          href={selected.thumb}
                          x={CX - 18}
                          y={CY - 66}
                          width={36}
                          height={36}
                          preserveAspectRatio="xMidYMid meet"
                          clipPath="url(#orbit-detail-clip)"
                        />
                      </>
                    ) : (
                      <text
                        x={CX}
                        y={CY - 36}
                        textAnchor="middle"
                        fontSize={19}
                        fontWeight="800"
                        fill={categoryColorFor(selected.category).color}
                        fontFamily="var(--font-serif)"
                      >
                        {initials(selected.name)}
                      </text>
                    )}
                    <text
                      x={CX}
                      y={CY + 2}
                      textAnchor="middle"
                      fontSize={15}
                      fontWeight="800"
                      fill="#ffffff"
                      fontFamily="var(--font-display)"
                    >
                      {truncate(selected.name, 22)}
                    </text>
                    <text
                      x={CX}
                      y={CY + 20}
                      textAnchor="middle"
                      fontSize={11}
                      fill="white"
                      fillOpacity={0.55}
                      fontFamily="var(--font-sans)"
                    >
                      {selected.category}
                    </text>
                    <text
                      x={CX}
                      y={CY + 44}
                      textAnchor="middle"
                      fontSize={11}
                      fill="white"
                      fillOpacity={0.75}
                      fontFamily="var(--font-sans)"
                    >
                      {selected.members} anggota · {selected.achievements} prestasi
                    </text>
                    <rect x={CX - 44} y={CY + 56} width={88} height={22} rx={11} fill="#FFFF00" />
                    <text
                      x={CX}
                      y={CY + 71}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight="700"
                      fill="#062A31"
                      fontFamily="var(--font-sans)"
                    >
                      Lihat profil
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </svg>

            {/* Tombol tutup di luar SVG supaya tidak ikut ter-skala. */}
            <AnimatePresence>
              {selected && (
                <motion.button
                  type="button"
                  key="close"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelected(null)}
                  aria-label="Tutup ringkasan ekskul"
                  className="absolute right-1 top-1 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 ring-1 ring-inset ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime sm:right-3 sm:top-6"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="mt-3 shrink-0 flex flex-col items-center">
          <Link
            href="/kehidupan/ekskul"
            className="btn-accent"
          >
            Lihat Semua Ekskul
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
