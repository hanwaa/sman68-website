# 003 — Slider galeri ke GPU: x jadi transform + tween

- **Status**: DONE
- **Commit**: 29ef3e4
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 1 file, ~5 baris

## Problem

Slider galeri memakai shorthand Framer Motion `x` yang jalan di main-thread (requestAnimationFrame), bukan compositor. Saat halaman sibuk loading gambar, animasi drop frame.

```tsx
// src/components/features/GaleriView.tsx:331-334 — current
<motion.div
  className="flex"
  animate={{ x: `${-slide * 100}%` }}
  transition={{ type: "spring", stiffness: 260, damping: 32 }}
>
```

Spring juga salah alat di sini: geser slide adalah motion predetermined (ke indeks pasti), bukan gesture yang bisa diinterupsi mid-drag. Spring bikin overshoot yang tidak diinginkan di carousel foto sekolah (personality: crisp formal, bukan playful).

## Target

```tsx
// target
<motion.div
  className="flex"
  animate={{ transform: `translateX(${-slide * 100}%)` }}
  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
>
```

Nilai eksak: `duration 0.3`, curve `--ease-drawer` = `cubic-bezier(0.32, 0.72, 0, 1)` (iOS drawer curve dari AUDIT.md). Hardware-accelerated karena string `transform` penuh.

## Repo conventions to follow

- Exemplar di repo untuk tween cepat: `src/components/features/FabWidget.tsx:217` — `transition={{ duration: 0.18 }}`. Plan ini memakai 0.3 karena jarak geser 100% lebar viewport butuh sedikit lebih lama dari popover.
- Jangan tiru spring `stiffness/damping` lama — hapus total.
- Hormati `reduceMotion`: file ini belum branch reduced-motion untuk slider. Tambahkan: jika `prefers-reduced-motion`, duration 0.01 (snap).

## Steps

1. Buka `src/components/features/GaleriView.tsx:1-20` — cek import. Tambahkan `useReducedMotion` dari `framer-motion` bila belum ada.
2. Ganti blok `src/components/features/GaleriView.tsx:331-334` menjadi target di atas (transform string + tween 0.3 + ease-drawer).
3. Tambahkan di atasnya: `const reduce = useReducedMotion();` lalu `transition={{ duration: reduce ? 0.01 : 0.3, ease: [0.32, 0.72, 0, 1] }}`.
4. Jangan ubah `className="flex"`, struktur `slides.map`, atau tombol prev/next.

## Boundaries

- Do NOT touch lightbox modal (`GaleriView.tsx:486-548`), thumbnail hover, atau dot indicator.
- Do NOT change markup/structure selain props `animate`/`transition`.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since 29ef3e4), STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm test` pass.
- **Feel check**: klik next/prev galeri 5x cepat. Confirm:
  - Geser 300ms, berhenti pas tanpa mantul/overshoot.
  - Spam klik tidak menumpuk animasi.
  - Di tab dengan throttling CPU 4x (DevTools Performance): tetap smooth, tidak patah-patah seperti sebelumnya.
  - `prefers-reduced-motion` → slide pindah instan.
- **Done when**: tidak ada lagi `animate={{ x:` di `GaleriView.tsx`.
