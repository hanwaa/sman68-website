"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Accessibility, MessageCircle, Sparkles, X } from "lucide-react";
import SchoolChat from "@/components/features/SchoolChat";
import { useA11y } from "@/components/providers/A11yProvider";
import { TEXT_SIZE_OPTIONS, type A11yBoolPrefKey } from "@/lib/a11y";
import { cn } from "@/lib/utils";

type PrefOption = { key: A11yBoolPrefKey; label: string; desc: string };

const OPTION_GROUPS: { title: string; options: PrefOption[] }[] = [
  {
    title: "Penglihatan",
    options: [
      { key: "highContrast", label: "Kontras tinggi", desc: "Pertegas kontras warna konten" },
      { key: "grayscale", label: "Mode hitam putih", desc: "Tampilkan konten tanpa warna" },
      {
        key: "colorBlind",
        label: "Ramah buta warna",
        desc: "Penanda merah diganti jingga agar tetap terbedakan",
      },
    ],
  },
  {
    title: "Membaca & Teks",
    options: [
      {
        key: "dyslexiaFont",
        label: "Font ramah disleksia",
        desc: "Huruf lebih tegas dan mudah dibedakan",
      },
      { key: "wideSpacing", label: "Spasi teks luas", desc: "Jarak huruf, kata, dan baris lebih lega" },
      { key: "underlineLinks", label: "Garis bawahi tautan", desc: "Tandai semua tautan dengan garis bawah" },
    ],
  },
  {
    title: "Interaksi & Gerak",
    options: [
      {
        key: "reduceMotion",
        label: "Matikan animasi",
        desc: "Hentikan carousel, marquee, dan transisi",
      },
      { key: "strongFocus", label: "Sorot fokus tegas", desc: "Outline fokus lebih tebal dan kontras" },
      { key: "touchTargets", label: "Area sentuh besar", desc: "Tombol dan tautan minimal 44px — mudah ditekan" },
    ],
  },
];

function PrefSwitch({
  option,
  checked,
  onToggle,
}: {
  option: PrefOption;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={checked}
      className="flex items-center justify-between gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-cream transition-colors text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{option.label}</span>
        <span className="block text-xs text-muted leading-snug">{option.desc}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "w-10 h-6 rounded-full p-0.5 flex-shrink-0 transition-colors",
          checked ? "bg-brand-green" : "bg-line"
        )}
      >
        <span
          className={cn(
            "block w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-4"
          )}
        />
      </span>
    </button>
  );
}

export default function FabWidget() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<"a11y" | "chat" | null>(null);
  const { prefs, setTextSize, togglePref, reset, activeCount } = useA11y();
  const panelRef = useRef<HTMLDivElement>(null);

  // Sengaja TIDAK memakai useModalA11y: panel ini popover, bukan modal layar
  // penuh. Menahan scroll dan menjebak fokus akan mencegah pengguna
  // berpindah ke halaman untuk melihat efek pengaturannya.
  useEffect(() => {
    if (panel !== "a11y") return;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panel]);

  // Panel pengaturan tidak muncul di portal: `/login` dan `/dashboard` punya
  // tata letak penuh layar dan FAB di sana akan menutupi kontrol yang lain.
  // Kelas mode disabilitas tetap berlaku di sana karena dipasang di <html>.
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/login")) return null;

  const openPanel = (next: "a11y" | "chat") => {
    setPanel((prev) => (prev === next ? null : next));
    setMenuOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 a11y-layer">
      <AnimatePresence>
        {panel === "a11y" && (
          <motion.div
            key="a11y"
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-[min(19rem,calc(100vw-2.5rem))] max-h-[min(74vh,32rem)] bg-white rounded-2xl shadow-card-hover border border-line overflow-hidden flex flex-col"
            role="dialog"
            aria-label="Mode disabilitas"
            tabIndex={-1}
          >
            <div className="bg-brand-pine px-3.5 py-2.5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-brand-lime/15 flex items-center justify-center flex-shrink-0">
                  <Accessibility size={16} className="text-brand-lime" aria-hidden="true" />
                </span>
                <div>
                  <div className="text-white font-semibold text-sm leading-tight">
                    Mode Disabilitas
                  </div>
                  <div className="text-white/60 text-xs leading-tight">
                    {activeCount} fitur aktif · tersimpan otomatis
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPanel(null)}
                className="btn-icon-dark"
                aria-label="Tutup mode disabilitas"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="p-2.5 space-y-0.5 overflow-y-auto min-h-0">
              <div className="px-3 pt-2 pb-1 text-xs font-bold text-muted uppercase tracking-wider">
                Ukuran Teks
              </div>
              <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
                {TEXT_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setTextSize(size.value)}
                    aria-pressed={prefs.textSize === size.value}
                    className={cn(
                      "chip justify-center px-2 leading-tight",
                      prefs.textSize === size.value && "chip-active"
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>

              {OPTION_GROUPS.map((group) => (
                <div key={group.title}>
                  <div className="px-3 pt-2 pb-1 text-xs font-bold text-muted uppercase tracking-wider">
                    {group.title}
                  </div>
                  {group.options.map((option) => (
                    <PrefSwitch
                      key={option.key}
                      option={option}
                      checked={prefs[option.key]}
                      onToggle={() => togglePref(option.key)}
                    />
                  ))}
                </div>
              ))}

              <div className="px-3 pt-3 pb-1">
                <button onClick={reset} className="btn-outline btn-sm w-full">
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
