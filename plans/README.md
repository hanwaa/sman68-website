# Animation Plans — SMAN 68

Audit: `improve-animations` + `emil-design-eng` + `review-animations` + `apple-design`.
Commit basis: `29ef3e4`. Semua plan self-contained untuk executor tanpa konteks.

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

## Urutan eksekusi yang disarankan

1. **001** — token + `transition-all`. Tanpa ini plan lain akan menebak curve sendiri.
2. **002 + 007** — hover image + button press (CSS kecil, risiko rendah, bisa paralel setelah 001 merge).
3. **008** — stagger + reduced-motion + whileHover (sentuh file yang sama dengan 002, jadi setelah 002).
4. **003 + 004 + 005** — galeri, hero, orbit (komponen berat, satu-per-satu, feel-check manual).
5. **006** — dropdown/modal navbar (terakhir karena tambah import + AnimatePresence, paling besar risiko konflik).

Jangan jalankan 002 dan 008 paralel di file yang sama (`EkskulList.tsx`, `GaleriView.tsx`) — jalankan berurutan.

## Cara eksekusi

- Satu plan = satu eksekutor terisolasi. Contoh: `improve-animations execute 001` atau berikan file plan ke agent mana pun.
- Setelah tiap plan: `npm run typecheck && npm run lint && npm test`, lalu feel-check sesuai bagian Verification di plan tersebut.
- Kalau kode di lapangan tidak cocok dengan kutipan di plan (drift sejak `29ef3e4`), STOP dan lapor — jangan improvisasi.
