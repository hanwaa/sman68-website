# 006 — Dropdown, mobile menu, search modal dapat entrance

- **Status**: DONE
- **Commit**: 29ef3e4
- **Severity**: HIGH
- **Category**: Missed opportunities + Physicality
- **Estimated scope**: 1 file (Navbar.tsx), ~40 baris

## Problem

Tiga elemen muncul instan (teleport) tanpa transisi — jarring:

```tsx
// src/components/layout/Navbar.tsx:325-328 — current, dropdown
{activeDropdown === item.label && (
  <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-card py-2 border border-line" role="menu">
```

```tsx
// src/components/layout/Navbar.tsx:406-411 — current, mobile menu
{mobileOpen && (
  <div className={cn("a11y-layer fixed inset-0 z-40 bg-brand-pine flex flex-col transition-all", scrolled ? "pt-16" : "pt-24")} role="dialog">
```

```tsx
// src/components/layout/Navbar.tsx:468-479 — current, search modal
{searchOpen && (
  <div className="a11y-layer fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4" role="dialog">
    <div className="absolute inset-0 bg-brand-pine/70" />
    <div className="relative w-full max-w-xl bg-white rounded-xl shadow-card border border-line overflow-hidden">
```

Dropdown juga tidak origin-aware (default center). Search dibuka via keyboard (`Ctrl+K`, `/` di baris 158-170) — menurut aturan frekuensi, aksi keyboard harus minim animasi, tapi di sini search adalah modal occasional (bukan toggle 100x/hari seperti command palette), jadi entrance 150-200ms masih boleh, asalkan exit cepat dan tidak blokir ketik.

## Target

Gunakan pola FAB yang sudah terbukti di repo (`FabWidget.tsx:128-131`):

```tsx
// target — dropdown (popover, anchor ke trigger → origin top-left)
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence>
{activeDropdown === item.label && (
  <motion.div
    initial={{ opacity: 0, scale: 0.97, y: -4 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.97, y: -4 }}
    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
    style={{ transformOrigin: "top left" }}
    className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-card py-2 border border-line"
    role="menu"
  >
```

```tsx
// target — search modal (modal tengah → origin center, exempt)
<motion.div
  initial={{ opacity: 0, scale: 0.96, y: 12 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.96, y: 12 }}
  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
  className="relative w-full max-w-xl bg-white rounded-xl shadow-card border border-line overflow-hidden"
/>
```

Mobile menu: full-screen dialog — jangan scale (aneh untuk fullscreen). Pakai opacity + y kecil saja:

```tsx
// target — mobile menu
<motion.div
  initial={{ opacity: 0, y: -8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
```

Nilai eksak: dropdown 150-250ms (pakai 0.18), modal 200-500ms (pakai 0.2/0.22).

## Repo conventions to follow

- Exemplar: `src/components/features/FabWidget.tsx:125-132` dan `src/components/features/SchoolChat.tsx:96-102` — tiru persis struktur `AnimatePresence` + `motion.div` + curve `[0.22, 1, 0.36, 1]` (setara dengan `[0.23, 1, 0.32, 1]`).
- `Navbar.tsx` saat ini belum import framer-motion — tambah import seperti di FabWidget.
- Dropdown delay close 150ms (`handleDropdownLeave` baris 152-154) sudah benar untuk hover intent — jangan ubah.

## Steps

1. Tambah `import { motion, AnimatePresence } from "framer-motion";` di `src/components/layout/Navbar.tsx:1-10`.
2. Bungkus dropdown baris 325-360 dengan `AnimatePresence` + ganti `div` menjadi `motion.div` dengan props target (origin top-left).
3. Bungkus mobile menu baris 406-466 dengan `AnimatePresence` + `motion.div` opacity/y (tanpa scale).
4. Bungkus search modal baris 468-571: backdrop `div.bg-brand-pine/70` jadi `motion.div` opacity saja; kotak putih jadi `motion.div` dengan scale 0.96+y12.
5. Pastikan `Escape` handler (baris 171-174) tetap menutup instan tanpa menunggu exit (AnimatePresence exit 0.18s tidak blokir fokus — input search `autoFocus` tetap langsung bisa diketik).
6. Jangan ubah `navItems`, `handleDropdownEnter/Leave`, atau logika `scrolled`.

## Boundaries

- Do NOT touch topbar, logo, atau tombol search trigger.
- Do NOT change markup/structure selain `div` → `motion.div` + AnimatePresence.
- Do NOT add new dependencies (framer-motion sudah ada).
- Keyboard open (`Ctrl+K`, `/`) harus tetap instan fokus ke input — animasi tidak boleh delay `autoFocus`.
- If drift since 29ef3e4, STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm test` pass.
- **Feel check**:
  - Hover menu PPDB/Profil → dropdown tumbuh dari trigger kiri-atas, bukan fade tengah.
  - Buka search via Ctrl+K → kotak muncul 200ms, tapi kursor langsung bisa mengetik tanpa jeda.
  - Buka mobile menu → geser halus dari atas, tutup via Escape instan.
  - Animations 10%: dropdown scale+opacity sinkron, origin terlihat dari kiri-atas.
- **Done when**: tidak ada lagi conditional `&& (` tanpa `AnimatePresence` untuk ketiga elemen ini.
