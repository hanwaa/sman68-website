# 005 — Detail orbit scale 0.7 jadi 0.95 + origin tengah

- **Status**: DONE
- **Commit**: 29ef3e4
- **Severity**: HIGH
- **Category**: Physicality & origin
- **Estimated scope**: 1 file, ~8 baris

## Problem

Panel detail ekskul di tengah konstelasi muncul dari `scale(0.7)` — terlihat muncul dari ketiadaan (pop). Tidak ada benda nyata yang muncul dari 70% ukuran.

```tsx
// src/components/sections/ConstellationSection.tsx:417-422 — current
<motion.g
  key={selected.id}
  initial={{ opacity: 0, scale: 0.7 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.7 }}
  transition={{ duration: 0.26, ease: "easeOut" }}
  style={{ transformOrigin: `${CX}px ${CY}px` }}
```

`transformOrigin` sudah benar (tengah, karena modal tengah — exempt dari aturan popover). Yang salah hanya nilai awal + easing lemah.

## Target

```tsx
// target
<motion.g
  key={selected.id}
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
  style={{ transformOrigin: `${CX}px ${CY}px` }}
```

Nilai eksak: `scale 0.95` (rentang AUDIT.md 0.9–0.97), `duration 0.22` (modal kecil 200-500ms, ambil bawah karena elemen SVG), curve `--ease-out`.

## Repo conventions to follow

- Exemplar yang sama persis di repo: `src/components/features/FabWidget.tsx:128-131` — `initial={{ opacity: 0, y: 16, scale: 0.96 }}` dengan `duration: 0.2`. Ikuti pola itu (bedanya di sini tanpa `y` karena SVG `<g>`).
- Jangan ubah `DETAIL_RADIUS`, `LOGO_RADIUS`, cincin, atau rAF rotasi.
- Pertahankan `AnimatePresence` exit (sudah ada).

## Steps

1. Edit `src/components/sections/ConstellationSection.tsx:419-422` — ganti `scale: 0.7` (initial+exit) menjadi `scale: 0.95`, `duration: 0.26` menjadi `0.22`, `ease: "easeOut"` menjadi `[0.23, 1, 0.32, 1]`.
2. Jangan ubah baris lain di `motion.g` (role, tabIndex, handler klik/keyboard).
3. Pastikan tombol close `ConstellationSection.tsx:608-613` (`initial opacity 0`) tetap — tidak perlu scale karena tombol kecil.

## Boundaries

- Do NOT touch rAF loop, radii tween, `positionAt`, atau SVG defs.
- Do NOT change markup/structure — props animasi saja.
- Do NOT add new dependencies.
- If drift since 29ef3e4, STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm test` pass.
- **Feel check**: klik planet ekskul di desktop. Confirm:
  - Panel membesar halus dari 95% (seperti balon sudah ada bentuknya), bukan meletup dari kecil.
  - Tutup → menyusut ke 95% + fade, tidak hilang instan.
  - Animations 10%: opacity dan scale sinkron, tidak ada lompatan.
- **Done when**: tidak ada lagi `scale: 0.7` di ConstellationSection.
