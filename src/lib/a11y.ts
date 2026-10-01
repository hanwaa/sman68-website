/**
 * Sumber tunggal untuk mode disabilitas.
 *
 * Modul ini sengaja dibuat bebas React dan bebas DOM supaya bisa diuji dengan
 * `node --test` (lihat tests/a11y-prefs.test.mjs) sekaligus dipakai ulang oleh
 * provider, komponen, dan script bootstrap pra-hydrasi.
 *
 * Aturan main: preferensi disimpan sebagai satu objek; efeknya diwujudkan
 * sebagai kelas pada elemen <html> supaya seluruh CSS bisa adjusting lewat
 * satu selector, tanpa tiap komponen harus tahu-menahu soal implementasinya.
 */

export type A11yPrefs = {
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

export type A11yPrefKey = keyof A11yPrefs;

export type TextSizePref = A11yPrefs["textSize"];

export const A11Y_STORAGE_KEY = "sman68_a11y_prefs";

export const defaultA11yPrefs: A11yPrefs = {
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

export const TEXT_SIZE_OPTIONS: { value: TextSizePref; label: string }[] = [
  { value: 0, label: "Normal" },
  { value: 1, label: "Besar" },
  { value: 2, label: "Sangat besar" },
];

/** Preferensi yang direpresentasikan sebagai satu kelas boolean. */
export const A11Y_BOOL_PREF_KEYS = [
  "highContrast",
  "grayscale",
  "colorBlind",
  "reduceMotion",
  "underlineLinks",
  "wideSpacing",
  "strongFocus",
  "dyslexiaFont",
  "touchTargets",
] as const satisfies readonly A11yPrefKey[];

export type A11yBoolPrefKey = (typeof A11Y_BOOL_PREF_KEYS)[number];

/** Pemetaan preferensi boolean -> kelas pada elemen <html>. */
export const A11Y_BOOL_CLASS: Record<A11yBoolPrefKey, string> = {
  highContrast: "a11y-contrast",
  grayscale: "a11y-grayscale",
  colorBlind: "a11y-colorblind",
  reduceMotion: "a11y-motion-off",
  underlineLinks: "a11y-links",
  wideSpacing: "a11y-spacing",
  strongFocus: "a11y-focus",
  dyslexiaFont: "a11y-dyslexia",
  touchTargets: "a11y-touch",
};

const TEXT_SIZE_CLASS: Record<TextSizePref, string | null> = {
  0: null,
  1: "a11y-text-lg",
  2: "a11y-text-xl",
};

/** Seluruh kelas yang boleh muncul di elemen <html> untuk mode disabilitas. */
export const A11Y_CLASS_NAMES: string[] = [
  ...Object.values(A11Y_BOOL_CLASS),
  ...Object.values(TEXT_SIZE_CLASS).filter((value): value is string => value !== null),
];

/** Kelas bawaan yang perlu dibersihkan dari <html> saat preferensi berubah. */
export function a11yClassesFor(prefs: A11yPrefs): string[] {
  const classes: string[] = [];
  for (const key of A11Y_BOOL_PREF_KEYS) {
    if (prefs[key]) classes.push(A11Y_BOOL_CLASS[key]);
  }
  const sizeClass = TEXT_SIZE_CLASS[prefs.textSize];
  if (sizeClass) classes.push(sizeClass);
  return classes;
}

/** Kembalikan objek prefs yang valid, abaikan apa pun yang rusak di storage. */
export function normalizeA11yPrefs(raw: unknown): A11yPrefs {
  if (!raw || typeof raw !== "object") return { ...defaultA11yPrefs };
  const source = raw as Record<string, unknown>;
  const next: A11yPrefs = { ...defaultA11yPrefs };

  const textSize = source.textSize;
  if (textSize === 0 || textSize === 1 || textSize === 2) {
    next.textSize = textSize;
  } else if (textSize === "0" || textSize === "1" || textSize === "2") {
    next.textSize = Number(textSize) as TextSizePref;
  }

  for (const key of A11Y_BOOL_PREF_KEYS) {
    next[key] = source[key] === true;
  }
  return next;
}

type StorageLike = Pick<Storage, "getItem"> | null | undefined;

export function readStoredA11yPrefs(storage: StorageLike): A11yPrefs {
  try {
    const raw = storage?.getItem(A11Y_STORAGE_KEY);
    if (!raw) return { ...defaultA11yPrefs };
    return normalizeA11yPrefs(JSON.parse(raw));
  } catch {
    return { ...defaultA11yPrefs };
  }
}

export function writeStoredA11yPrefs(
  storage: Pick<Storage, "setItem"> | null | undefined,
  prefs: A11yPrefs
) {
  try {
    storage?.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage penuh atau ditolak browser, abaikan, preferensi tetap jalan */
  }
}

/**
 * Script yang di-inline sebelum halaman dirender. Tujuannya satu: tidak ada
 * kedipan (FOUC) saat pengguna yang sudah pernah menyalakan mode disabilitas
 * membuka situs. Script ini sengaja sangat pendek dan tidak boleh bergantung
 * pada bundel apa pun.
 */
export const A11Y_BOOTSTRAP_SCRIPT = `(function(){try{var r=document.documentElement;var p=JSON.parse(localStorage.getItem(${JSON.stringify(
  A11Y_STORAGE_KEY
)})||"null");if(!p){return}var c=r.classList;if(p.textSize===1){c.add("a11y-text-lg")}if(p.textSize===2){c.add("a11y-text-xl")}if(p.highContrast){c.add("a11y-contrast")}if(p.grayscale){c.add("a11y-grayscale")}if(p.colorBlind){c.add("a11y-colorblind")}if(p.reduceMotion){c.add("a11y-motion-off")}if(p.underlineLinks){c.add("a11y-links")}if(p.wideSpacing){c.add("a11y-spacing")}if(p.strongFocus){c.add("a11y-focus")}if(p.dyslexiaFont){c.add("a11y-dyslexia")}if(p.touchTargets){c.add("a11y-touch")}}catch(e){}})();`;
