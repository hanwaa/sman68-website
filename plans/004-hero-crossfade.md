# 004 — Hero crossfade 1.1s jadi 0.5s + blur + curve kuat

- **Status**: DONE
- **Commit**: 29ef3e4
- **Severity**: HIGH
- **Category**: Easing & duration + Cohesion
- **Estimated scope**: 2 files, ~15 baris

## Problem

Hero slideshow crossfade 1.1 detik dengan `easeInOut` bawaan (lemah) — terasa sluggish dan double-expose (dua foto terlihat tumpuk lama). Kenburns 12s juga pakai `ease-out` bawaan yang hambar.

```tsx
// src/components/sections/HeroSection.tsx:62-68 — current
<motion.div
  key={currentSlide}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 1.1, ease: "easeInOut" }}
```

```css
/* src/app/globals.css:112-114 — current */
.animate-kenburns {
  animation: kenburns 12s ease-out forwards;
}
```

Interval slide 6 detik (`HeroSection.tsx:26`), jadi 1.1s = 18% waktu hanya untuk crossfade — terlalu lama. Headline stagger `duration:0.45 delay:0.08+i*0.08` (`HeroSection.tsx:107`) juga tanpa curve kuat.

## Target

```tsx
// target — HeroSection.tsx:62-68
<motion.div
  key={currentSlide}
  initial={{ opacity: 0, filter: "blur(2px)", transform: "scale(1.02)" }}
  animate={{ opacity: 1, filter: "blur(0px)", transform: "scale(1)" }}
  exit={{ opacity: 0, filter: "blur(2px)" }}
  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
>
```

```css
/* target — globals.css */
.animate-kenburns {
  animation: kenburns 12s cubic-bezier(0.23, 1, 0.32, 1) forwards;
}
```

Headline: tambah `ease: [0.23, 1, 0.32, 1]` di `transition={{ duration: 0.45, ... }}`. CTA `duration:0.4` tambah curve sama.

Blur 2px menutupi double-expose (sesuai AUDIT.md: mask imperfect crossfade dengan blur, keep <20px).

## Repo conventions to follow

- Curve eksak `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` dari plan 001. Di Framer Motion tulis sebagai array `[0.23, 1, 0.32, 1]`.
- Exemplar blur+scale sudah dipakai di lightbox galeri (`scale-110 blur-lg` di `GaleriView.tsx:352`) — pola sama, tapi di sini hanya 2px dan sementara.
- Jangan ubah interval 6s, parallax `bgY/contentY`, atau `reduceMotion` branch yang sudah benar.

## Steps

1. Edit `src/components/sections/HeroSection.tsx:62-68` — ganti transition menjadi target (0.5s + curve + blur/scale).
2. Edit `src/app/globals.css:112-114` — ganti `ease-out` kenburns menjadi `cubic-bezier(0.23, 1, 0.32, 1)`.
3. Edit `src/components/sections/HeroSection.tsx:107` — tambah `ease: [0.23, 1, 0.32, 1]` pada headline stagger.
4. Edit `src/components/sections/HeroSection.tsx:124` — tambah `ease: [0.23, 1, 0.32, 1]` pada CTA.
5. Pastikan `prefersReduced` branch tetap skip parallax (sudah ada di baris 57,88 — jangan dihapus).

## Boundaries

- Do NOT touch progress bar `hero-progress`, tombol prev/next, atau `useContent` hero.
- Do NOT change markup/structure — props animasi saja.
- Do NOT add new dependencies. Blur 2px murah, jangan naikkan ke >4px.
- If drift since 29ef3e4, STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm test` pass.
- **Feel check**: biarkan slideshow jalan 3 slide. Confirm:
  - Pindah foto 0.5s, snap, tidak ada fase abu-abu tumpuk lama.
  - Di Animations panel 10%: tidak terlihat dua wajah/foto tajam bersamaan (blur menjembatani).
  - Headline kata-per-kata masuk cepat berurutan, bukan melayang lambat.
  - `prefers-reduced-motion` → tidak ada zoom/parallax, hanya opacity.
- **Done when**: tidak ada lagi `duration: 1.1` atau `easeInOut` di HeroSection.
