# 002 — Hover image 500/700ms jadi 200ms + gate hover

- **Status**: DONE
- **Commit**: 29ef3e4
- **Severity**: HIGH
- **Category**: Easing & duration + Accessibility
- **Estimated scope**: 10 files, ~20 baris

## Problem

Semua thumbnail pakai `duration-500` bahkan `duration-700` untuk hover zoom — terasa sluggish untuk elemen yang dilihat puluhan kali sehari. Plus hover tidak di-gate, jadi di HP (tap = hover) memicu zoom palsu.

```tsx
// src/components/features/BeritaList.tsx:142 — current
className="object-cover transition-transform duration-500 group-hover:scale-105"
```

```tsx
// src/components/features/GaleriView.tsx:203 — current
className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
```

```tsx
// src/components/features/GuruStaf.tsx:102 — current
className="object-cover object-top transition-transform duration-300 ease-out group-hover:scale-102"
```

Lokasi sama di: `AlumniNetwork.tsx:219`, `FasilitasMap.tsx:268`, `AchievementWall.tsx:472`, `AlumniCareerMap.tsx:356`, `FacilitiesHighlight.tsx:65`, `NewsSection.tsx:58`, `PeopleSection.tsx:80`, `GaleriView.tsx:285,359,456`.

## Target

```tsx
// target — semua thumbnail hover
className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
```

Untuk `GaleriView.tsx:203` yang 700ms → 200ms juga (bukan 300ms). Skala pertahankan (`scale-105` / `scale-[1.04]`), hanya durasi yang dipangkas.

Tambah gating global sekali di `globals.css` agar hover-transform hanya jalan di device hover asli:

```css
/* target — tambah di @layer utilities, dekat .marquee */
@media (hover: none) {
  .group:hover .group-hover\:scale-105,
  .group:hover .group-hover\:scale-\[1\.04\],
  .group:hover .group-hover\:scale-\[1\.03\],
  .group:hover .group-hover\:scale-\[1\.02\] {
    transform: none;
  }
}
```

Catatan: Tailwind tidak punya varian hover-gating bawaan untuk `group-hover`, jadi override CSS di atas adalah cara paling murah tanpa refactor markup.

## Repo conventions to follow

- Exemplar durasi benar: `src/components/features/FabWidget.tsx:131` — 200ms. Ikuti itu, bukan 500ms lama.
- Jangan ubah `scale` ratio atau `object-cover` — hanya `duration-*` dan tambah gate CSS.
- Token easing: pakai `ease-out` bawaan Tailwind di sini (setara visual dengan `--ease-out` untuk hover kecil).

## Steps

1. Di `src/components/features/BeritaList.tsx:142,188`, `AlumniNetwork.tsx:219`, `FasilitasMap.tsx:268`, `AchievementWall.tsx:472`, `AlumniCareerMap.tsx:356`, `FacilitiesHighlight.tsx:65`, `NewsSection.tsx:58`, `PeopleSection.tsx:80`, `InstagramHighlight.tsx:72`, `GaleriView.tsx:285,359,456` — ganti `duration-500` → `duration-200`. Pertahankan `ease-out` bila sudah ada, tambah bila belum.
2. Di `src/components/features/GaleriView.tsx:203` — ganti `duration-700` → `duration-200`.
3. Di `src/components/features/GuruStaf.tsx:102` — `duration-300 ease-out` → `duration-200 ease-out` (samakan).
4. Tambah blok `@media (hover: none)` di `src/app/globals.css` dalam `@layer utilities` (setelah `.marquee-track`).
5. Grep `duration-500` dan `duration-700` di `src/components/features/*`, `src/components/sections/*` — sisa yang boleh tinggal hanya skeleton/marquee dekoratif, bukan hover thumbnail.

## Boundaries

- Do NOT touch skeleton `animate-pulse`, marquee, shimmer, drift (dekoratif).
- Do NOT change markup/structure — class strings only.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since 29ef3e4), STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm run lint`, `npm test` pass.
- **Feel check**: hover thumbnail Berita/Galeri/Guru di desktop — zoom terasa instan ~200ms, bukan melambat. Di emulator mobile (touch): tap tidak memicu zoom nyangkut.
- Buka DevTools Animations 10% playback: transform selesai <250ms.
- **Done when**: tidak ada lagi `group-hover:scale` dengan `duration-500/700` di fitur/sections.
