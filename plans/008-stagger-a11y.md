# 008 — Cap stagger + lengkapi reduced-motion + whileHover ke CSS

- **Status**: DONE
- **Commit**: 29ef3e4
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens + Accessibility
- **Estimated scope**: 6 files, ~20 baris

## Problem

Tiga masalah kecil tapi menyebar:

A. Stagger tanpa cap — list panjang bikin delay menumpuk >1 detik:

```tsx
// src/components/features/ProfilSekolah.tsx:125 — current
transition={{ delay: i * 0.1 }}

// src/components/features/EkskulList.tsx:191 — current
transition={{ delay: i * 0.03 }}

// src/components/features/GaleriView.tsx:444 — current
transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: "easeOut" }}
```

`ProfilSekolah` dan `EkskulList` tidak di-cap. Aturan: stagger 30-80ms antar item, total cap ~0.3s, jangan blokir interaksi.

B. `whileHover` JS untuk efek yang bisa CSS:

```tsx
// src/components/features/EkskulList.tsx:192 — current
whileHover={{ y: -4 }}
```

Di touch device ini memicu hover palsu dan jalan di main-thread. Sudah ada CSS `hover:-translate-y-1` di `InstagramHighlight.tsx:59` — pakai itu saja.

C. Reduced-motion belum lengkap:

```css
/* src/app/globals.css:359-366 — current, belum mencakup hero */
@media (prefers-reduced-motion: reduce) {
  .animate-breathe, .animate-drift, .animate-drift-slow,
  .animate-shimmer, .marquee-track { animation: none; }
  .marquee { overflow-x: auto; }
}
```

`.animate-kenburns` dan `.hero-progress` masih jalan saat reduced-motion. Padahal hero adalah gerakan terbesar di viewport.

## Target

```tsx
// target A — cap semua stagger
transition={{ delay: Math.min(i * 0.05, 0.3), ease: [0.23, 1, 0.32, 1] }}
```

```tsx
// target B — EkskulList card
<motion.article
  layout
  // hapus whileHover
  className={cn("card p-4 cursor-pointer group transition-transform duration-200 ease-out hover:-translate-y-1", ...)}
```

```css
/* target C — tambah di media query reduce */
@media (prefers-reduced-motion: reduce) {
  .animate-breathe, .animate-drift, .animate-drift-slow,
  .animate-shimmer, .marquee-track,
  .animate-kenburns, .hero-progress {
    animation: none;
  }
  .marquee { overflow-x: auto; }
}
```

## Repo conventions to follow

- Exemplar cap yang sudah benar: `src/components/features/AlumniCareerMap.tsx:344` — `delay: Math.min(i * 0.03, 0.2)`. Tiru pola `Math.min` itu (tapi pakai 0.05 step dan cap 0.3 sesuai target).
- Exemplar hover CSS: `src/components/features/InstagramHighlight.tsx:59` — `hover:-translate-y-1`.
- Jangan ubah `MotionConfig reducedMotion="always"` di `A11yProvider.tsx:93` — itu sudah benar, plan ini hanya melengkapi CSS.

## Steps

1. Edit `src/components/features/ProfilSekolah.tsx:125,278` — `delay: i * 0.1` → `delay: Math.min(i * 0.05, 0.3)` + tambah `ease: [0.23, 1, 0.32, 1]`.
2. Edit `src/components/features/EkskulList.tsx:191` — `delay: i * 0.03` → `delay: Math.min(i * 0.05, 0.3)`; hapus `whileHover={{ y: -4 }}` baris 192; tambah `hover:-translate-y-1` di className card baris 195.
3. Edit `src/components/features/BeritaList.tsx:175`, `AlumniNetwork.tsx:206`, `AchievementWall.tsx:458`, `AlumniCareerMap.tsx:344` — samakan ke `Math.min(i * 0.05, 0.3)` bila masih pakai `i * 0.03/0.04/0.06` mentah.
4. Edit `src/components/features/GaleriView.tsx:444` — tambah `ease: [0.23, 1, 0.32, 1]` (cap `Math.min(index,8)` sudah benar, pertahankan).
5. Edit `src/app/globals.css:359-366` — tambah `.animate-kenburns, .hero-progress` ke daftar `animation: none`.
6. Grep `whileHover` di `src/` — sisa yang boleh tinggal hanya yang gesture-driven (tidak ada saat ini); semua hover statis harus CSS.

## Boundaries

- Do NOT touch rAF orbit, hero interval, atau marquee duration.
- Do NOT change markup/structure selain props transition/class.
- Do NOT add new dependencies.
- If drift since 29ef3e4, STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm test` pass.
- **Feel check**:
  - Buka halaman Ekskul/Profil dengan 20+ item: item masuk cascade cepat (<0.5s total), tidak satu-per-satu lambat. Interaksi (klik) langsung bisa tanpa nunggu stagger selesai.
  - Hover kartu Ekskul di desktop: naik 4px halus; di mobile: tidak nyangkut.
  - Aktifkan `prefers-reduced-motion` (DevTools Rendering): hero diam (tidak zoom/progress), marquee jadi scroll manual, tapi fade opacity tetap ada.
- **Done when**: tidak ada `delay: i *` tanpa `Math.min`, tidak ada `whileHover={{ y:` statis, dan `kenburns+hero-progress` masuk reduce block.
