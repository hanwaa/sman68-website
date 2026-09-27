"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";
import {
  A11Y_BOOL_PREF_KEYS,
  A11Y_CLASS_NAMES,
  a11yClassesFor,
  defaultA11yPrefs,
  normalizeA11yPrefs,
  readStoredA11yPrefs,
  writeStoredA11yPrefs,
  type A11yBoolPrefKey,
  type A11yPrefs,
  type TextSizePref,
} from "@/lib/a11y";

type A11yContextValue = {
  prefs: A11yPrefs;
  /** Turunkan untuk hemat render saat hanya perlu tahu status "matikan animasi". */
  reduceMotion: boolean;
  setTextSize: (value: TextSizePref) => void;
  togglePref: (key: A11yBoolPrefKey) => void;
  reset: () => void;
  activeCount: number;
};

const A11yContext = createContext<A11yContextValue | null>(null);

export function useA11y(): A11yContextValue {
  const value = useContext(A11yContext);
  if (!value) {
    throw new Error("useA11y harus dipakai di dalam <A11yProvider>");
  }
  return value;
}

/**
 * Menyimpan preferensi mode disabilitas di <html> sebagai kelas, sehingga
 * seluruh aturan CSS (termasuk yang hanya untuk satu pref tertentu) berlaku
 * untuk semua elemen tanpa perlu masing-masing komponen membaca state.
 *
 * `MotionConfig` di sini adalah jaring pengaman: dengan menyetel
 * `reducedMotion`, seluruh animasi framer-motion di situs ikut berhenti —
 * termasuk yang tidak punya handler khusus, yang sebelumnya lolos begitu saja.
 */
export default function A11yProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<A11yPrefs>(defaultA11yPrefs);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(readStoredA11yPrefs(window.localStorage));
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Jangan sentuh kelas <html> sebelum storage terbaca. Script bootstrap di
    // layout sudah memasang kelas yang benar sebelum hydrate; kalau efek ini
    // berjalan lebih dulu dengan preferensi default, kelas itu akan dihapus
    // selama satu frame dan halaman berkedip.
    if (!hydrated) return;
    const root = document.documentElement;
    for (const name of A11Y_CLASS_NAMES) root.classList.remove(name);
    for (const name of a11yClassesFor(prefs)) root.classList.add(name);
    writeStoredA11yPrefs(window.localStorage, prefs);
  }, [prefs, hydrated]);

  const setTextSize = useCallback((value: TextSizePref) => {
    setPrefs((current) => normalizeA11yPrefs({ ...current, textSize: value }));
  }, []);

  const togglePref = useCallback((key: A11yBoolPrefKey) => {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  const reset = useCallback(() => setPrefs(defaultA11yPrefs), []);

  const value = useMemo<A11yContextValue>(() => {
    const activeCount =
      (prefs.textSize > 0 ? 1 : 0) + A11Y_BOOL_PREF_KEYS.filter((key) => prefs[key]).length;
    return {
      prefs,
      reduceMotion: prefs.reduceMotion,
      setTextSize,
      togglePref,
      reset,
      activeCount,
    };
  }, [prefs, setTextSize, togglePref, reset]);

  return (
    <A11yContext.Provider value={value}>
      <MotionConfig reducedMotion={prefs.reduceMotion ? "always" : "user"}>
        {children}
      </MotionConfig>
    </A11yContext.Provider>
  );
}
