# 007 — Button press feedback scale 0.97

- **Status**: DONE
- **Commit**: 29ef3e4
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 file (globals.css), ~10 baris

## Problem

Semua tombol hanya punya `active:translate-y-px` (geser 1px) tanpa `scale` — feedback tekan terasa mati. Aturan Apple #1: feedback harus di pointer-down, instan, kontinu.

```css
/* src/app/globals.css:182-188 — current */
.btn-primary {
  @apply inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5
         bg-brand-green text-white font-semibold text-sm tracking-[-0.01em]
         hover:bg-brand-green-deep active:translate-y-px
         disabled:pointer-events-none disabled:opacity-50
         transition-colors duration-150;
}
```

Pola sama di `.btn-accent`, `.btn-secondary`, `.btn-ghost`, `.btn-outline`, `.btn-danger` (baris 190-228). `transition-colors` saja tidak menganimasikan `transform`, jadi `active:translate-y-px` meloncat tanpa transisi.

## Target

```css
/* target — contoh btn-primary, terapkan ke 6 varian */
.btn-primary {
  @apply inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5
         bg-brand-green text-white font-semibold text-sm tracking-[-0.01em]
         hover:bg-brand-green-deep active:scale-[0.97]
         disabled:pointer-events-none disabled:opacity-50
         transition-[transform,background-color] duration-150;
}
.btn-primary:active {
  transition-duration: 100ms;
}
```

Nilai eksak dari AUDIT.md: `transform: scale(0.97)` + `transition: transform 160ms ease-out` (rentang 100-160ms untuk press, 0.95-0.98 untuk skala). Di Tailwind: `active:scale-[0.97]` + `transition-[transform,background-color] duration-150`. Hapus `active:translate-y-px` (geser vertikal tidak natural untuk press; scale yang benar).

## Repo conventions to follow

- Jangan buat CSS baru di luar `@layer components` — edit di tempat (baris 182-228).
- `disabled:pointer-events-none disabled:opacity-50` pertahankan.
- FAB (`FabWidget.tsx:243`) juga punya `active:translate-y-px` — biarkan plan 001 yang menangani (ganti ke scale di sana), jangan duplikat di sini.

## Steps

1. Edit `src/app/globals.css:182-228` — di `.btn-primary`, `.btn-accent`, `.btn-secondary`, `.btn-ghost`, `.btn-outline`, `.btn-danger`: ganti `active:translate-y-px` → `active:scale-[0.97]`, ganti `transition-colors duration-150` → `transition-[transform,background-color] duration-150`.
2. Tambahkan setelah tiap blok (atau satu blok global): `.btn-primary:active, .btn-accent:active, ... { transition-duration: 100ms; }` agar press terasa instan.
3. Jangan ubah `.btn-sm`, `.btn-lg`, `.btn-hero`, `.btn-icon`, `.chip` (bukan tombol utama; chip ditangani plan stagger bila perlu).

## Boundaries

- Do NOT touch markup `.tsx` — CSS only.
- Do NOT add new dependencies.
- Do NOT ubah warna hover (hanya press feedback).
- If drift since 29ef3e4, STOP and report.

## Verification

- **Mechanical**: `npm run typecheck`, `npm test` pass.
- **Feel check**: tekan-tahan tombol PPDB/Masuk (mouse down, jangan lepas). Confirm:
  - Tombol menyusut 3% dalam ~100ms saat pointer-down (bukan saat release).
  - Lepas → kembali 150ms ease-out.
  - Tidak ada pergeseran layout (scale tidak menggeser tetangga, tidak seperti translate-y).
- **Done when**: tidak ada lagi `active:translate-y-px` di `globals.css` btn varian.
