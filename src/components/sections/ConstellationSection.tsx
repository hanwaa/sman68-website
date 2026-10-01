"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useA11y } from "@/components/providers/A11yProvider";
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
const RING_RADII_OPEN = [178, 226, 268, 310, 350];
const RING_DURATIONS = [48, 64, 80, 96, 112];
const RING_ANGLES = [0, 22, 48, 12, 36];

/**
 * Jari-jari panel detail di tengah, dalam satuan viewBox. Panel dibuat
 * sebesar ini supaya nama ekskul yang panjang tetap terbaca; cincin harus
 * terdorong ke RING_RADII_OPEN agar tidak bertabrakan.
 */
const DETAIL_RADIUS = 146;

/**
 * Jari-jari logo ekskul besar di buletan tengah. Logo dipotong presisi
 * menjadi lingkaran lewat clipPath `orbit-detail-logo-circle`.
 */
const LOGO_RADIUS = 96;

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
  const { reduceMotion } = useA11y();

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
  /** True ketika kursor/fokus berada di buletan tengah -> info muncul di depan logo. */
  const [centerHovered, setCenterHovered] = useState(false);

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

    // Kurangi gerak: cincin langsung melompat ke posisi akhir, tanpa tween.
    if (
      reduceMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
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
  }, [selected, reduceMotion]);

  const positionAt = (ri: number, ii: number) => {
    const ring = rings[ri];
    const a = ((ring.baseAngle + (ii * 360) / ring.items.length) * Math.PI) / 180;
    const radius = radiiRef.current[ri];
    return { x: CX + radius * Math.cos(a), y: CY + radius * Math.sin(a) };
  };

  const mapRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const offscreenRef = useRef(false);
  const [hovered, setHovered] = useState<Ekskul | null>(null);
  const router = useRouter();

  /** Klik planet -> buka buletan tengah berisi logo ekskul (besar, berbentuk lingkaran). */
  const selectEkskul = (item: Ekskul) => {
    setCenterHovered(false);
    setSelected((current) => (current?.id === item.id ? null : item));
  };

  const openEkskul = (item: Ekskul) => {
    setSelected(null);
    setCenterHovered(false);
    router.push(`/kehidupan/ekskul?ekskul=${item.id}`);
  };

  /**
   * Di desktop: klik langsung membuka halaman profil.
   * Di layar sentuh (hover: none): sentuhan pertama memunculkan info di depan
   * logo, sentuhan berikutnya (atau tombol "Buka Profil") yang membuka halaman.
   */
  const handleCenterClick = (e: React.MouseEvent) => {
    if (!selected) return;
    const touchOnly =
      typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
    if (touchOnly && !centerHovered) {
      e.preventDefault();
      e.stopPropagation();
      setCenterHovered(true);
      return;
    }
    openEkskul(selected);
  };

  /**
   * Hemat CPU dengan menghentikan rotasi HANYA saat konstelasi benar-benar
   * keluar dari viewport. Berbeda dari versi lama, ini tidak pernah memakai
   * threshold 0.05 dan tidak pernah bereaksi terhadap hover, jadi menyentuh
   * planet tidak lagi membuat animasi berhenti.
   */
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        offscreenRef.current = !entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Kurangi motion: loop rAF tidak dijalankan sama sekali, bukan hanya
    // dilewati di dalam tick, supaya tidak tetap membakar frame di layar.
    if (reduceMotion) return;
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

      // Berputar terus: tidak ada jeda karena hover atau karena kategori.
      // Hanya berhenti saat benar-benar di luar layar.
      if (offscreenRef.current) return;

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
  }, [rings, reduceMotion]);

  return (
    <section
      // Tinggi satu layar hanya di desktop. Di HP section dibiarkan mengikuti
      // tinggi isinya supaya tidak memaksa halaman melompat saat berganti
      // address bar saat scroll.
      className="bg-brand-pine overflow-hidden pt-20 pb-6 md:min-h-[100svh] md:pt-[6.5rem] md:pb-4 flex flex-col"
      aria-label="Ekskul & Organisasi"
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-2xl mx-auto text-center mb-2 shrink-0"
        >
          <h2 className="font-display font-extrabold uppercase text-white text-balance text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.16em]">
            Ekstrakurikuler
          </h2>
          <span
            className="block w-14 h-0.5 bg-brand-lime mx-auto mt-2.5"
            aria-hidden="true"
          />
          <p className="mt-1.5 text-sm text-white/60">
            Klik salah satu ekskul untuk melihat ringkasannya
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="flex-1 min-h-0 flex items-center justify-center"
        >
          <div
            ref={mapRef}
            // Orbit memakai sisa tinggi layar: 92vw di layar sempit (HP),
            // calc(100svh - 262px) di layar lebar, dibatasi 760px. 262px = navbar
            // (104) + judul (~92) + tombol (~44) + padding bawah (16) + margin aman.
            // Dengan begitu bagian ini selalu pas satu layar tanpa scroll.
            className="orbit-map relative mx-auto aspect-square w-[min(92vw,calc(100svh-262px))] max-w-[760px]"
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
                  <circle cx="0" cy="0" r={26} />
                </clipPath>
                {/* Bulatan tengah tempat logo ekskul ditampilkan besar. */}
                <clipPath id="orbit-detail-panel-clip">
                  <circle cx={CX} cy={CY} r={DETAIL_RADIUS - 2} />
                </clipPath>
                {/* Logo dipotong tepat menjadi lingkaran. */}
                <clipPath id="orbit-detail-logo-circle">
                  <circle cx={CX} cy={CY} r={LOGO_RADIUS} />
                </clipPath>
                <radialGradient id="orbit-detail-scrim" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#062A31" stopOpacity="0.82" />
                  <stop offset="60%" stopColor="#062A31" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#062A31" stopOpacity="0.62" />
                </radialGradient>
                <filter id="orbit-text-shadow" x="-25%" y="-25%" width="150%" height="150%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.95" />
                </filter>
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
                        aria-label={`${item.name}, ${item.category}. Lihat ringkasan ekskul`}
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
                        <title>{`${item.name}, ${item.category}`}</title>
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
              {/* Buletan tengah: logo ekskul besar & berbentuk lingkaran.
                  Klik planet -> logo muncul. Hover buletan -> info di depan logo. */}
              <AnimatePresence>
                {selected && (
                  <motion.g
                    key={selected.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                    style={{ transformOrigin: `${CX}px ${CY}px` }}
                    onClick={handleCenterClick}
                    onMouseEnter={() => setCenterHovered(true)}
                    onMouseLeave={() => setCenterHovered(false)}
                    onFocus={() => setCenterHovered(true)}
                    onBlur={() => setCenterHovered(false)}
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
                    {/* Cincin luar + cincin putus-putus */}
                    <circle
                      cx={CX}
                      cy={CY}
                      r={DETAIL_RADIUS}
                      fill="#062A31"
                      stroke={categoryColorFor(selected.category).color}
                      strokeWidth={2.5}
                    />
                    <circle
                      cx={CX}
                      cy={CY}
                      r={DETAIL_RADIUS - 6}
                      fill="none"
                      stroke="white"
                      strokeOpacity={0.15}
                      strokeDasharray="5 7"
                    />

                    {/* ===== LOGO BESAR BERBENTUK LINGKARAN ===== */}
                    {selected.logo || selected.thumb ? (
                      <g>
                        {/* Alasan: plat putih supaya logo transparan & foto rapi */}
                        <circle
                          cx={CX}
                          cy={CY}
                          r={LOGO_RADIUS}
                          fill="#ffffff"
                          style={{
                            opacity: centerHovered ? 0.18 : 1,
                            transition: "opacity 0.28s ease",
                          }}
                        />
                        <image
                          href={selected.logo ?? selected.thumb ?? ""}
                          x={CX - LOGO_RADIUS}
                          y={CY - LOGO_RADIUS}
                          width={LOGO_RADIUS * 2}
                          height={LOGO_RADIUS * 2}
                          preserveAspectRatio="xMidYMid slice"
                          clipPath="url(#orbit-detail-logo-circle)"
                          style={{
                            opacity: centerHovered ? 0.34 : 1,
                            transition: "opacity 0.28s ease",
                          }}
                        />
                        {/* Bingkai lingkaran warna kategori */}
                        <circle
                          cx={CX}
                          cy={CY}
                          r={LOGO_RADIUS}
                          fill="none"
                          stroke={categoryColorFor(selected.category).color}
                          strokeWidth={2.5}
                          strokeOpacity={centerHovered ? 0.4 : 0.85}
                          style={{ transition: "stroke-opacity 0.28s ease" }}
                        />
                      </g>
                    ) : (
                      <g>
                        <circle cx={CX} cy={CY} r={LOGO_RADIUS} fill="#04424C" />
                        <text
                          x={CX}
                          y={CY + 32}
                          textAnchor="middle"
                          fontSize={88}
                          fontWeight="900"
                          fill={categoryColorFor(selected.category).color}
                          style={{
                            opacity: centerHovered ? 0.2 : 0.9,
                            transition: "opacity 0.28s ease",
                          }}
                          fontFamily="var(--font-serif)"
                        >
                          {initials(selected.name)}
                        </text>
                      </g>
                    )}

                    {/* ===== INFO DI DEPAN LOGO (muncul saat hover) ===== */}
                    <g
                      style={{
                        opacity: centerHovered ? 1 : 0,
                        transition: "opacity 0.28s ease",
                        pointerEvents: "none",
                      }}
                    >
                      <circle cx={CX} cy={CY} r={DETAIL_RADIUS} fill="url(#orbit-detail-scrim)" />

                      <g filter="url(#orbit-text-shadow)">
                        {/* Badge kategori */}
                        <g transform={`translate(${CX} ${CY - 56})`}>
                          <rect
                            x={-58}
                            y={-11}
                            width={116}
                            height={22}
                            rx={11}
                            fill="#062A31"
                            fillOpacity={0.92}
                            stroke={categoryColorFor(selected.category).color}
                            strokeWidth={1.2}
                          />
                          <text
                            x={0}
                            y={4}
                            textAnchor="middle"
                            fontSize={10.5}
                            fontWeight="800"
                            fill={categoryColorFor(selected.category).color}
                            fontFamily="var(--font-sans)"
                            letterSpacing="0.08em"
                          >
                            {selected.category.toUpperCase()}
                          </text>
                        </g>

                        {/* Nama ekskul */}
                        <text
                          x={CX}
                          y={CY - 8}
                          textAnchor="middle"
                          fontSize={21}
                          fontWeight="800"
                          fill="#ffffff"
                          fontFamily="var(--font-display)"
                        >
                          {truncate(selected.name, 22)}
                        </text>

                        {/* Statistik */}
                        <text
                          x={CX}
                          y={CY + 16}
                          textAnchor="middle"
                          fontSize={12}
                          fill="#E4F7FA"
                          fillOpacity={0.92}
                          fontFamily="var(--font-sans)"
                        >
                          {selected.members} anggota · {selected.achievements} prestasi
                        </text>

                        {/* Tombol aksi */}
                        <g transform={`translate(${CX} ${CY + 50})`}>
                          <rect x={-62} y={-14} width={124} height={28} rx={14} fill="#FFFF00" />
                          <text
                            x={0}
                            y={4.5}
                            textAnchor="middle"
                            fontSize={11.5}
                            fontWeight="800"
                            fill="#062A31"
                            fontFamily="var(--font-sans)"
                          >
                            Buka Profil
                          </text>
                        </g>
                      </g>
                    </g>
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
                  onClick={() => {
                    setSelected(null);
                    setCenterHovered(false);
                  }}
                  aria-label="Tutup ringkasan ekskul"
                  className="absolute right-1 top-1 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 ring-1 ring-inset ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-lime sm:right-3 sm:top-6"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="mt-2 shrink-0 flex flex-col items-center">
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
