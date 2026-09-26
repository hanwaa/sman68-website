"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  EKSKUL_CATEGORIES,
  categoryColors,
  categoryColorFor,
  type Ekskul,
  type EkskulCategory,
} from "@/lib/ekskul";
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
const RING_RADII = [95, 150, 205, 260, 315];
const RING_DURATIONS = [48, 64, 80, 96, 112];
const RING_ANGLES = [0, 22, 48, 12, 36];

function initials(name: string) {
  const words = name.split(" ");
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
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

  const positionAt = (ri: number, ii: number) => {
    const ring = rings[ri];
    const a = ((ring.baseAngle + (ii * 360) / ring.items.length) * Math.PI) / 180;
    return { x: CX + ring.radius * Math.cos(a), y: CY + ring.radius * Math.sin(a) };
  };

  const mapRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const pausedRef = useRef(false);
  const visibleRef = useRef(true);
  const [hovered, setHovered] = useState<Ekskul | null>(null);
  const [activeCategory, setActiveCategory] = useState<EkskulCategory | null>(null);
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

  const openEkskul = (id: string) => {
    router.push(`/kehidupan/ekskul?ekskul=${id}`);
  };

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

      if (pausedRef.current || !visibleRef.current || a11yPauseRef.current) return;

      let index = 0;
      rings.forEach((ring, ri) => {
        angles[ri] = (angles[ri] + dt * (360 / ring.duration) * ring.direction) % 360;
        const step = 360 / ring.items.length;
        ring.items.forEach((_, ii) => {
          const a = ((ring.baseAngle + angles[ri] + ii * step) * Math.PI) / 180;
          const x = CX + ring.radius * Math.cos(a);
          const y = CY + ring.radius * Math.sin(a);
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
    <section className="py-12 md:py-16 bg-brand-pine overflow-hidden" aria-label="Ekskul & Organisasi">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-6 md:mb-8"
        >
          <h2 className="font-display font-extrabold uppercase text-white text-balance text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0.08em] sm:tracking-[0.12em] md:tracking-[0.16em]">
            Ekstrakurikuler
          </h2>
          <span
            className="block w-14 h-0.5 bg-brand-lime mx-auto mt-5"
            aria-hidden="true"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div
            ref={mapRef}
            className="orbit-map relative max-w-[420px] sm:max-w-[480px] mx-auto"
            onPointerEnter={() => {
              pausedRef.current = true;
            }}
            onPointerLeave={() => {
              pausedRef.current = false;
            }}
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
              </defs>

              {rings.map((ring) => (
                <circle
                  key={ring.id}
                  cx={CX}
                  cy={CY}
                  r={ring.radius}
                  fill="none"
                  stroke="white"
                  strokeOpacity={activeCategory ? 0.05 : 0.09}
                  strokeWidth={1}
                />
              ))}

              <circle cx={CX} cy={CY} r={54} fill="#0F5F39" stroke="#B7EC6E" strokeOpacity={0.4} strokeWidth={1.5} />

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
                        className={`orbit-planet transition-opacity duration-300 ${
                          activeCategory && item.category !== activeCategory
                            ? "opacity-20"
                            : "opacity-100"
                        }`}
                        tabIndex={0}
                        role="link"
                        aria-label={`${item.name} — ${item.category}. Buka halaman ekskul`}
                        onMouseEnter={() => setHovered(item)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(item)}
                        onBlur={() => setHovered(null)}
                        onClick={() => openEkskul(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openEkskul(item.id);
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
            </svg>
          </div>
        </motion.div>

        <div className="mt-6 md:mt-8 flex flex-col items-center gap-5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {EKSKUL_CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(active ? null : cat)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                    active
                      ? "border-brand-lime/60 bg-white/10 text-white"
                      : "border-white/10 text-white/55 hover:text-white hover:border-white/25"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: categoryColors[cat].color }}
                  />
                  {cat}
                  <span className={active ? "text-white/60" : "text-white/30"}>
                    {ekskulList.filter((e) => e.category === cat).length}
                  </span>
                </button>
              );
            })}
          </div>

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
