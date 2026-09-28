# 001 — Ganti transition-all dengan properti spesifik + token easing

- **Status**: DONE
- **Commit**: 29ef3e4
- **Severity**: HIGH
- **Category**: Performance + Cohesion & tokens
- **Estimated scope**: 12 files, ~25 baris

## Problem

`transition-all` menganimasikan properti tak terduga di luar GPU (layout/paint) dan membuat hover terasa berat. Ditemukan di 20+ tempat. Contoh nyata:

```css
/* src/app/globals.css:270-274 — current */
.card {
  @apply bg-white rounded-2xl border border-line shadow-card
         hover:shadow-card-hover hover:border-brand-leaf/30
         transition-all duration-200 overflow-hidden;
}
```

```tsx
// src/components/layout/Navbar.tsx:279-282 — current
"relative flex-shrink-0 group-hover:scale-105 transition-all duration-300 ease-out",
```

```tsx
// src/components/features/FabWidget.tsx:243 — current
className="w-12 h-12 sm:w-14 sm:h-14 rounded-full ... hover:bg-brand-green active:translate-y-px transition-all"
```

```tsx
// src/components/features/InstagramHighlight.tsx:59 — current
className="group ... shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ..."
```

Kenapa penting: setiap hover kartu/navbar memicu transisi `all` termasuk `background-color`, `border-color`, `box-shadow` sekaligus — boros dan tidak konsisten. Standar: sebutkan properti eksak.

## Target

Tambah token easing global sekali, pakai di semua tempat. Nilai eksak dari AUDIT.md, jangan aproximasi:

```css
/* target — tambah di src/app/globals.css :root (di bawah --muted) */
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}
```

```css
/* target — .card */
.card {
  transition: transform 200ms var(--ease-out), box-shadow 200ms ease-out, border-color 200ms ease-out;
}
```

```tsx
// target — Navbar logo, nav-link
"relative flex-shrink-0 group-hover:scale-105 transition-transform duration-200 ease-out"
"nav-link flex items-center gap-1 px-3 py-2 transition-colors duration-200 ease-out"
```

Aturan penggantian:
- Kalau ada `hover:scale`, `hover:-translate-y`, `active:translate` → `transition-transform duration-200 ease-out` (+ `transition-colors` bila warna juga berubah, tulis dua-duanya eksplisit).
- Kalau cuma warna/border/shadow → `transition-colors duration-200 ease-out` atau `transition: box-shadow 200ms ease-out, border-color 200ms ease-out`.
- Jangan sisakan satu pun `transition-all` di `src/`.

## Repo conventions to follow

- Exemplar yang sudah benar di repo ini: `src/components/features/FabWidget.tsx:131` — `transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}`. Pakai keluarga kurva yang sama (`--ease-out` di atas setara dengan `[0.23, 1, 0.32, 1]`).
- Token ditaruh di `:root` `src/app/globals.css:9-24`, sejajar dengan `--brand-*`. Jangan buat file tokens baru.
- Durasi UI: 150-250ms (dropdown/hover/card). Jangan pakai 300ms+ untuk hover.

## Steps

1. Edit `src/app/globals.css:9-24` — tambah tiga token `--ease-out`, `--ease-in-out`, `--ease-drawer` di dalam `:root`.
2. Edit `src/app/globals.css:270-274` — ganti `.card` `transition-all duration-200` menjadi `transition: transform 200ms var(--ease-out), box-shadow 200ms ease-out, border-color 200ms ease-out;`.
3. Edit `src/components/layout/Navbar.tsx:188` — topbar `transition-all duration-300 ease-out` → `transition: height 300ms var(--ease-out), opacity 300ms ease-out`.
4. Edit `src/components/layout/Navbar.tsx:269` — nav container `transition-all duration-300 ease-out` → `transition: height 300ms var(--ease-out)`.
5. Edit `src/components/layout/Navbar.tsx:280` — logo `transition-all duration-300 ease-out` → `transition-transform duration-200 ease-out`.
6. Edit `src/components/layout/Navbar.tsx:307,366` — nav-link `transition-all duration-300 ease-out` → `transition-colors duration-200 ease-out`.
7. Edit `src/components/layout/Navbar.tsx:409` — mobile menu `transition-all` → hapus (elemen conditional-render, tidak ada transisi) atau ganti `transition-colors`.
8. Edit `src/components/layout/Footer.tsx:102` — sosmed `transition-all` → `transition-colors duration-200 ease-out`.
9. Edit `src/components/features/InstagramHighlight.tsx:59` — `transition-all duration-300` → `transition: transform 200ms var(--ease-out), box-shadow 200ms ease-out`.
10. Edit `src/components/features/GuruStaf.tsx:97`, `src/components/features/EkskulList.tsx:195`, `src/components/features/AchievementWall.tsx:462`, `src/components/features/AlumniCareerMap.tsx:258`, `src/components/dashboard/DashboardView.tsx:281` — pola sama: `transition-all` → `transition-colors` atau `transform+shadow+border` eksplisit sesuai properti hover-nya.
11. Edit `src/components/features/FabWidget.tsx:243` — tombol utama `transition-all` → `transition: transform 160ms var(--ease-out), background-color 200ms ease-out`.
12. Grep ulang `transition-all` di `src/` — hasil harus nol.

## Boundaries

- Do NOT touch `src/app/globals.css` selain `:root` dan `.card`.
- Do NOT change markup/structure — motion properties only.
- Do NOT add new dependencies.
- Do NOT ubah durasi marquee/drift/breathe (dekoratif, ditangani plan lain).
- If a step doesn't match the code you find (drift since 29ef3e4), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npm run typecheck` (harus pass), `npm run lint` (harus pass), `npm test` (34 tests pass).
- **Feel check**: buka homepage, hover kartu Berita/Prestasi/Ekskul dan menu navbar. Confirm:
  - Hover terasa snap 200ms, tidak ada lag tertinggal.
  - Di DevTools Animations panel playback 10%: hanya transform/shadow/border yang berubah, tidak ada background-position/size ikut animasi.
  - Toggle `prefers-reduced-motion` tetap aman (tidak break).
- **Done when**: `grep -r "transition-all" src/` kosong + token `--ease-out` ada di `:root`.
