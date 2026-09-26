"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Accessibility, MessageCircle, Sparkles, X } from "lucide-react";
import SchoolChat from "@/components/features/SchoolChat";
import { cn } from "@/lib/utils";

type Prefs = {
  textSize: 0 | 1 | 2;
  highContrast: boolean;
  grayscale: boolean;
  colorBlind: boolean;
  reduceMotion: boolean;
  underlineLinks: boolean;
  wideSpacing: boolean;
  strongFocus: boolean;
  dyslexiaFont: boolean;
  touchTargets: boolean;
};

const STORAGE_KEY = "sman68_a11y_prefs";

const defaultPrefs: Prefs = {
  textSize: 0,
  highContrast: false,
  grayscale: false,
  colorBlind: false,
  reduceMotion: false,
  underlineLinks: false,
  wideSpacing: false,
  strongFocus: false,
  dyslexiaFont: false,
  touchTargets: false,
};

const TEXT_SIZES = [
  { value: 0, label: "Normal" },
  { value: 1, label: "Besar" },
  { value: 2, label: "Sangat besar" },
] as const;

export default function FabWidget() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<"a11y" | "chat" | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);

  // Muat preferensi
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...defaultPrefs, ...JSON.parse(raw) });
    } catch {
      /* abaikan */
    }
  }, []);

  // Terapkan preferensi
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("a11y-text-lg", prefs.textSize === 1);
    root.classList.toggle("a11y-text-xl", prefs.textSize === 2);
    root.classList.toggle("a11y-contrast", prefs.highContrast);
    root.classList.toggle("a11y-grayscale", prefs.grayscale);
    root.classList.toggle("a11y-colorblind", prefs.colorBlind);
    root.classList.toggle("a11y-motion-off", prefs.reduceMotion);
    root.classList.toggle("a11y-links", prefs.underlineLinks);
    root.classList.toggle("a11y-spacing", prefs.wideSpacing);
    root.classList.toggle("a11y-focus", prefs.strongFocus);
    root.classList.toggle("a11y-dyslexia", prefs.dyslexiaFont);
    root.classList.toggle("a11y-touch", prefs.touchTargets);

    window.dispatchEvent(
      new CustomEvent("sman68:reduced-motion", { detail: { enabled: prefs.reduceMotion } })
    );

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* abaikan */
    }
  }, [prefs]);

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/login")) return null;

  const togglePref = (key: keyof Prefs) => {
    if (key === "textSize") return;
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const openPanel = (p: "a11y" | "chat") => {
    setPanel((prev) => (prev === p ? null : p));
    setMenuOpen(false);
  };

  const activePrefsCount = Object.entries(prefs).filter(
    ([k, v]) => (k === "textSize" ? (v as number) > 0 : Boolean(v))
  ).length;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {panel === "a11y" && (
          <motion.div
            key="a11y"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-[min(19rem,calc(100vw-2.5rem))] max-h-[min(74vh,32rem)] bg-white rounded-2xl shadow-card-hover border border-line overflow-hidden flex flex-col"
            role="dialog"
            aria-label="Mode disabilitas"
          >
            <div className="bg-brand-pine px-3.5 py-2.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-brand-lime/15 flex items-center justify-center">
                  <Accessibility size={16} className="text-brand-lime" aria-hidden="true" />
                </span>
                <div>
                  <div className="text-white font-semibold text-sm leading-tight">Mode Disabilitas</div>
                  <div className="text-white/50 text-[10px]">
                    {activePrefsCount} fitur aktif · tersimpan otomatis
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPanel(null)}
                className="btn-icon-dark"
                aria-label="Tutup mode disabilitas"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-2.5 space-y-0.5 overflow-y-auto min-h-0">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                Ukuran Teks
              </div>
              <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
                {TEXT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setPrefs((p) => ({ ...p, textSize: size.value }))}
                    aria-pressed={prefs.textSize === size.value}
                    className={cn(
                      "chip justify-center",
                      prefs.textSize === size.value && "chip-active"
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>

              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                Penglihatan
              </div>
              {[
                { key: "highContrast" as const, label: "Kontras tinggi", desc: "Pertegas kontras warna konten" },
                { key: "grayscale" as const, label: "Mode hitam putih", desc: "Tampilkan konten tanpa warna" },
                { key: "colorBlind" as const, label: "Ramah buta warna", desc: "Penanda merah diganti jingga agar tetap terbedakan" },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => togglePref(option.key)}
                  role="switch"
                  aria-checked={prefs[option.key]}
                  className="flex items-center justify-between gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-cream transition-colors text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{option.label}</span>
                    <span className="block text-[11px] text-muted">{option.desc}</span>
                  </span>
                  <span
                    className={cn(
                      "w-10 h-6 rounded-full p-0.5 flex-shrink-0 transition-colors",
                      prefs[option.key] ? "bg-brand-green" : "bg-line"
                    )}
                  >
                    <span
                      className={cn(
                        "block w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                        prefs[option.key] && "translate-x-4"
                      )}
                    />
                  </span>
                </button>
              ))}

              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                Membaca & Teks
              </div>
              {[
                { key: "dyslexiaFont" as const, label: "Font ramah disleksia", desc: "Huruf lebih tegas dan mudah dibedakan" },
                { key: "wideSpacing" as const, label: "Spasi teks luas", desc: "Jarak huruf, kata, dan baris lebih lega" },
                { key: "underlineLinks" as const, label: "Garis bawahi tautan", desc: "Tandai semua tautan dengan garis bawah" },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => togglePref(option.key)}
                  role="switch"
                  aria-checked={prefs[option.key]}
                  className="flex items-center justify-between gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-cream transition-colors text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{option.label}</span>
                    <span className="block text-[11px] text-muted">{option.desc}</span>
                  </span>
                  <span
                    className={cn(
                      "w-10 h-6 rounded-full p-0.5 flex-shrink-0 transition-colors",
                      prefs[option.key] ? "bg-brand-green" : "bg-line"
                    )}
                  >
                    <span
                      className={cn(
                        "block w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                        prefs[option.key] && "translate-x-4"
                      )}
                    />
                  </span>
                </button>
              ))}

              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-muted uppercase tracking-wider">
                Interaksi & Gerak
              </div>
              {[
                { key: "reduceMotion" as const, label: "Matikan animasi", desc: "Hentikan carousel, marquee, dan transisi" },
                { key: "strongFocus" as const, label: "Sorot fokus tegas", desc: "Outline fokus lebih tebal dan kontras" },
                { key: "touchTargets" as const, label: "Area sentuh besar", desc: "Tombol dan tautan minimal 44px — mudah ditekan" },
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => togglePref(option.key)}
                  role="switch"
                  aria-checked={prefs[option.key]}
                  className="flex items-center justify-between gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-cream transition-colors text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{option.label}</span>
                    <span className="block text-[11px] text-muted">{option.desc}</span>
                  </span>
                  <span
                    className={cn(
                      "w-10 h-6 rounded-full p-0.5 flex-shrink-0 transition-colors",
                      prefs[option.key] ? "bg-brand-green" : "bg-line"
                    )}
                  >
                    <span
                      className={cn(
                        "block w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
                        prefs[option.key] && "translate-x-4"
                      )}
                    />
                  </span>
                </button>
              ))}

              <div className="px-3 pt-3 pb-1">
                <button
                  onClick={() => setPrefs(defaultPrefs)}
                  className="btn-outline btn-sm w-full"
                >
                  Reset Semua ke Normal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel === "chat" && <SchoolChat onClose={() => setPanel(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-end gap-2.5"
          >
            <button
              onClick={() => openPanel("a11y")}
              className="flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-brand-pine text-white text-sm font-semibold shadow-card-hover border border-white/10 hover:bg-brand-green transition-colors"
            >
              <Accessibility size={16} className="text-brand-lime" aria-hidden="true" />
              Mode Disabilitas
            </button>
            <button
              onClick={() => openPanel("chat")}
              className="flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-brand-pine text-white text-sm font-semibold shadow-card-hover border border-white/10 hover:bg-brand-green transition-colors"
            >
              <MessageCircle size={16} className="text-brand-lime" aria-hidden="true" />
              Tanya Sekolah
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          if (panel) setPanel(null);
          setMenuOpen((o) => !o);
        }}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand-pine text-white shadow-card-hover border border-white/10 flex items-center justify-center hover:bg-brand-green active:translate-y-px transition-all"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Tutup menu bantuan" : "Buka menu bantuan"}
      >
        {menuOpen ? (
          <X size={22} aria-hidden="true" />
        ) : (
          <Sparkles size={22} className="text-brand-lime" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
