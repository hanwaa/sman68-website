# Animation Plans — SMAN 68

Audit: `improve-animations` + `emil-design-eng` + `review-animations` + `apple-design`.
Commit basis 001-008: `29ef3e4`. Commit basis 009-014: `67dd9db` (audit ulang seluruh situs). Semua plan self-contained untuk executor tanpa konteks.

## Daftar plan

| No | File | Severity | Status | Ketergantungan |
| --- | --- | --- | --- | --- |
| 001 | `001-transition-all-tokens.md` | HIGH | DONE | — (fondasi, kerjakan pertama) |
| 002 | `002-image-hover-200ms.md` | HIGH | DONE | setelah 001 (sentuh file yang sama) |
| 003 | `003-galeri-slider-gpu.md` | HIGH | DONE | setelah 001 (pakai `--ease-drawer`) |
| 004 | `004-hero-crossfade.md` | HIGH | DONE | setelah 001 (pakai `--ease-out`) |
| 005 | `005-orbit-detail-scale.md` | HIGH | DONE | setelah 001 |
| 006 | `006-dropdown-modal-entrance.md` | HIGH | DONE | setelah 001 |
| 007 | `007-button-press-feedback.md` | MEDIUM | DONE | setelah 001 |
| 008 | `008-stagger-a11y.md` | MEDIUM | DONE | setelah 001 + 002 (sentuh hover/stagger yang sama) |
| 009 | `009-navbar-scroll-motion.md` | HIGH | REVERTED (user pilih 500ms) | — |
| 010 | `010-dashboard-sidebar-motion.md` | HIGH | DONE | — |
| 011 | `011-dashboard-modal-motion.md` | HIGH | DONE | — (membuat `src/lib/motion.ts`) |
| 012 | `012-reduced-motion-semantics.md` | MEDIUM | DONE | setelah 011 (pakai helper `prefersReducedMotion`) |
| 013 | `013-transition-property-press.md` | MEDIUM | DONE | — (file berbeda dari 014) |
| 014 | `014-hover-gating-touch.md` | MEDIUM | DONE | setelah 012 (sama-sama edit `globals.css`) |

Catatan audit ulang 67dd9db: temuan "search palette dianimasikan" **tidak** dijadikan plan — plan 006 sudah memutuskan sadar bahwa search modal bersifat occasional (bukan command palette 100x/hari) sehingga entrance 200ms boleh. Keputusan itu dihormati.

## Urutan eksekusi yang disarankan

1. **009 + 010** — Navbar & sidebar (risiko rendah, independen).
2. **011** — modul `src/lib/motion.ts` + spec modal/toast. Wajib sebelum 012.
3. **013** — properti transisi + press (independen dari 012).
4. **012** — semantik reduced-motion (butuh `lib/motion.ts` dari 011).
5. **014** — gate hover sentuh (setelah 012, sama-sama menyentuh `globals.css`).

Jangan jalankan 012 dan 014 paralel (file `globals.css` sama). 013 dan 014 boleh paralel (file berbeda, kecuali tidak ada overlap).

## Cara eksekusi

- Satu plan = satu eksekutor terisolasi. Contoh: `improve-animations execute 009` atau berikan file plan ke agent mana pun.
- Setelah tiap plan: `npm run typecheck && npm run lint && npm test`, lalu feel-check sesuai bagian Verification di plan tersebut.
- Kalau kode di lapangan tidak cocok dengan kutipan di plan (drift sejak commit basis masing-masing), STOP dan lapor — jangan improvisasi.
