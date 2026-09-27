# Website SMAN 68 Jakarta

> **Disiplin. Kreasi. Prestasi.**

Situs resmi SMAN 68 Jakarta — Next.js 16 (App Router) + React 19 + TypeScript, dengan
content publik yang sepenuhnya berasal dari database, dashboard tiga peran, dan mode
aksesibilitas yang benar-benar mengubah tampilan serta perilaku aplikasi.

- **Produksi:** <https://sman68-jkt.my.id>
- **Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 3 · PostgreSQL (Neon) · Cloudflare R2

---

## Daftar Isi

- [Fitur](#fitur)
- [Arsitektur](#arsitektur)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Variabel Environment](#variabel-environment)
- [Database](#database)
- [Perintah npm](#perintah-npm)
- [Struktur Proyek](#struktur-proyek)
- [Skrip Bantu](#skrip-bantu)
- [Deploy](#deploy)
- [Testing](#testing)
- [Catatan Teknis](#catatan-teknis)
- [Dokumen Lain](#dokumen-lain)

---

## Fitur

**Halaman publik**

| Halaman | Isi |
|---|---|
| `/` | Hero, statistik, sorotan fasilitas, constellation ekskul |
| `/tentang/profil`, `/tentang/visi-misi`, `/tentang/fasilitas` | Profil, visi-misi, fasilitas |
| `/tentang/guru-staf` | Foto + filter mata pelajaran + pencarian |
| `/kehidupan/ekskul` | Orbit ekskul + grid, deep-link ke kartu ekskul |
| `/kehidupan/galeri` | Album & foto |
| `/berita`, `/berita/[slug]` | Daftar berita dan detail |
| `/ppdb`, `/ppdb/biaya`, `/ppdb/faq` | Panduan PPDB interaktif, timeline, biaya, FAQ |
| `/akademik/program` | Program studi |
| `/prestasi` | Prestasi + leaderboard |
| `/komunitas/alumni` | Kartu alumni (jurusan, kampus, tombol LinkedIn) |
| `/aksesibilitas` | Panel pengaturan aksesibilitas |
| `/kebijakan-privasi` | Kebijakan privasi |

**Dashboard (`/dashboard`)** — tiga peran dengan hak akses berbeda:

- **Siswa** — jadwal, agenda kalender, presensi, tugas & submission kelas, buku nilai, notifikasi
- **Guru** — absensi siswa, kelola tugas kelas, moderasi konten, rapor nilai
- **Admin** — manajemen user, CMS konten publik, pengumuman, prestasi, moderasi

**Mode aksesibilitas** (`/aksesibilitas`, tersimpan otomatis): buta warna, font disleksia,
tiga level ukuran teks, matikan animasi (menghentikan carousel & orbit sungguhan), area
sentuh minimum 44px, kontras, grayscale, spasi luas, garis bawah tautan, dan fokus tegas.
Semua token warna di `tailwind.config.ts` sudah diuji kontrasnya terhadap WCAG AA.

---

## Arsitektur

```
Browser
   │  HTTPS
   ▼
Nginx (VPS)  ──►  Next.js 16 (PM2, 127.0.0.1:3000)
                          │            │
                          │            └─► Cloudflare R2  (aset, upload via presigned URL
                          │                                    langsung dari browser)
                          └────────────► Neon Postgres  (data & session)
```

- **Database:** Neon Postgres (serverless). Driver dipilih otomatis dari hostname —
  `*.neon.tech` memakai `@neondatabase/serverless`, selain itu memakai `pg` dengan
  connection pool (`src/lib/db.ts`). Cocok untuk Postgres lokal saat pengembangan.
- **Penyimpanan aset:** Cloudflare R2. Upload berjalan dari browser ke R2 memakai
  presigned URL yang diterbitkan `POST /api/uploads/presign`.
- **Auth:** akun + `auth_sessions` di database, cookie sesi httpOnly, pembatasan percobaan
  login di `auth_login_attempts`, dan proteksi CSRF pada endpoint yang mengubah data.
- **Content:** konten publik dibaca server-side (`src/lib/content-server.ts`) lalu dikirim
  lewat `GET /api/content` dengan `Cache-Control` diatur di `next.config.mjs`.

---

## Menjalankan Secara Lokal

**Prasyarat**

- Node.js **>= 20.9.0** (disarankan 22 LTS)
- PostgreSQL — bisa Neon (cloud) atau Postgres lokal
- Akun Cloudflare R2 (opsional, hanya bila butuh upload aset)

**Langkah**

```bash
# 1. Pasang dependensi
npm install

# 2. Siapkan environment
cp .env.example .env.local
# lalu isi DATABASE_URL dan kredensial R2 di .env.local

# 3. Siapkan skema tabel
node scripts/db-init.mjs

# 4. Jalankan mode pengembangan
npm run dev
```

Buka <http://localhost:3000>.

Database lokal bisa dipakai tanpa Neon:

```bash
DATABASE_URL=postgresql://sman68:password@127.0.0.1:5432/sman68
```

> **Jangan pernah commit `.env.local`.** Pola `.env*` sudah dikecualikan di `.gitignore`
> kecuali `.env.example`.

---

## Variabel Environment

Semua variabel dijelaskan di `.env.example`. Ringkasnya:

| Variabel | Wajib | Kegunaan |
|---|---|---|
| `DATABASE_URL` | ya | Koneksi PostgreSQL (Neon atau lokal). `DB_POOL_MAX` opsional untuk driver `pg` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | untuk upload | Kredensial Cloudflare R2 |
| `R2_PUBLIC_BASE_URL` | untuk upload | URL publik bucket (`r2.dev` atau custom domain) |
| `NEXT_PUBLIC_APP_URL` | ya | URL dasar aplikasi, dipakai untuk metadata & sitemap |
| `SEED_SECRET` | opsional | Header `x-seed-secret` untuk `POST /api/admin/seed` |
| `TINYFISH_API_KEY` | opsional | Chatbot "Tanya Sekolah" mencari info terbaru di web. Kosong = nonaktif |
| `NEXT_PUBLIC_INSTAGRAM_EMBED_URL` | opsional | Widget Instagram di halaman Berita. Alternatif: `INSTAGRAM_FEED_URL`, `NEXT_PUBLIC_INSTAGRAM_FEED_URL`, atau `SCRAPECREATORS_API_KEY` |
| `GSC_CLIENT_ID`, `GSC_CLIENT_SECRET`, `GSC_REFRESH_TOKEN`, `GSC_SITE` | opsional | Hanya dipakai skrip manual di `scripts/`, bukan aplikasi |
| `NEXT_DIST_DIR`, `NEXT_BUILD_CPUS`, `OG_HERO` | opsional | Khusus proses build/deploy |

---

## Database

Skema lengkap ada di [`db/schema.sql`](db/schema.sql) — 40+ tabel yang mencakup konten
publik, akademik, dan autentikasi:

- **Konten publik** — `school_profile`, `accreditations`, `news`, `announcements`,
  `achievements`, `extracurriculars`, `gallery_albums`, `gallery_photos`, `facilities`,
  `facility_highlights`, `hero_slides`, `people_photos`, `testimonials`, `events`, `faqs`,
  `ppdb_config`
- **Akademik** — `teachers`, `students`, `classes`, `class_members`, `class_posts`,
  `class_comments`, `class_assignments`, `class_submissions`, `class_schedules`,
  `attendance`, `homeroom_classes`
- **Komunitas** — `alumni`, `alumni_paths`, `alumni_educations`, `cities`, `universities`
- **Autentikasi & platform** — `accounts`, `auth_sessions`, `auth_login_attempts`,
  `profiles`, `moderation_queue`, `notifications`, `user_preferences`

Skema idempotent (`if not exists`), jadi aman dijalankan berulang kali:

```bash
node scripts/db-init.mjs
```

Untuk mengisi konten awal dari data statis:

```bash
curl -X POST https://sman68-jkt.my.id/api/admin/seed \
  -H "x-seed-secret: $SEED_SECRET"
```

---

## Perintah npm

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm start` | Menjalankan hasil build |
| `npm run lint` | ESLint pada `src` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Type-check konfigurasi tes lalu jalankan `node --test` |
| `npm run audit` | `npm audit` untuk dependency produksi |

---

## Struktur Proyek

```
src/
├── app/                  # App Router — halaman & API route
│   ├── api/              # 20 route handler (auth, cms, upload, chat, dll)
│   ├── dashboard/        # Dashboard tiga peran
│   ├── tentang/ living/  # berita/ prestasi/ komunitas/ ppdb/ akademik/ aksesibilitas/
│   └── sitemap.ts, robots.ts
├── components/
│   ├── layout/           # Navbar, Footer
│   ├── features/         # Komponen fitur (EkskulList, GuruStaf, dll)
│   ├── sections/         # Section halaman utama
│   ├── dashboard/        # Komponen dashboard
│   ├── seo/              # Metadata, JSON-LD
│   └── ui/               # Primitif UI
└── lib/                  # 37 modul: db, auth, cms, r2, seo, upload, aksesibilitas, dll

db/schema.sql             # Skema PostgreSQL
deploy/                   # Skrip deploy (VPS/Webuzo), Nginx, konfigurasi PM2
scripts/                  # db-init, upload R2, generate OG, Google Search Console
tests/                    # Uji CSRF, kebijakan upload, remote image
docs/                     # Peta situs (HTML + PDF)
```

---

## Skrip Bantu

```bash
node scripts/db-init.mjs          # Terapkan db/schema.sql
node scripts/upload-assets-r2.mjs # Unggah aset lokal ke Cloudflare R2
node scripts/generate-og.mjs      # Buat gambar OG image
node scripts/scrape-sekolah.mjs   # Kumpulkan data sekolah dari sumber publik
node scripts/gsc-auth.mjs         # Login Google Search Console (manual)
node scripts/gsc-sitemap.mjs      # Kirim sitemap ke GSC (manual)
```

Kredensial GSC dibaca dari environment atau `~/.config/sman68-gsc.env` (di luar repo,
`chmod 600`).

---

## Deploy

Konten lengkap: **[DEPLOY-VPS.md](DEPLOY-VPS.md)**.

Ringkasnya, deploy ke VPS (Ubuntu + Nginx + PM2):

```bash
# di server
git pull
NEXT_DIST_DIR=.next-new npm run build   # build ke slot terpisah
# script menukar .next-new dengan .next lalu reload PM2 → downtime ~1–2 detik
bash deploy/remote-deploy.sh
```

Berkas pendukung:

| Berkas | Isi |
|---|---|
| `deploy/remote-deploy.sh` | Deploy dua slot (zero-downtime ±1–2 detik) |
| `deploy/deploy.sh` | Deploy biasa via git pull |
| `deploy/deploy-webuzo.sh` | Deploy di hosting cPanel/Webuzo |
| `deploy/nginx-sman68.conf` | Konfigurasi reverse proxy + cache |
| `deploy/ecosystem.config.cjs` | Konfigurasi PM2 |
| `deploy/webuzo-*.sh` | Setup SSL dan diagnosis |

---

## Testing

```bash
npm test
```

Menjalankan `node --test` atas tiga suite di `tests/`: proteksi CSRF, kebijakan upload
gambar, dan penanganan URL gambar remote.

---

## Catatan Teknis

- **TypeScript ketat** dengan alias path. Modul `lib` yang menyentuh database, R2, atau
  secret ditandai `server-only` agar tidak pernah ikut ter-bundle ke client.
- **Cache berlapis** — `minimumCacheTTL` optimizer gambar 30 hari, `s-maxage` untuk
  `/api/content` dan `/sitemap.xml`, `stale-while-revalidate` agar deploy tidak memutus
  request Google.
- **Hardening** — HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, `poweredByHeader: false`, dan `noindex` pada
  seluruh `/api/*` kecuali `/api/og`.
- **Format gambar** dibatasi ke WebP untuk menutup jalur AVIF yang terdampak advisory
  image optimizer.
- **Font** dimuat lewat `@fontsource-variable` (Noto Serif, Source Sans 3, Stack Sans
  Headline) sehingga tidak ada request ke pihak ketiga saat render.
- **Aksesibilitas** — target Lighthouse 100 pada halaman utama, dashboard, PPDB,
  prestasi, ekskul, dan pengumuman.

---

## Dokumen Lain

| Dokumen | Isi |
|---|---|
| [DEPLOY-VPS.md](DEPLOY-VPS.md) | Panduan migrasi Vercel → VPS, DNS, SSL, PM2, troubleshooting |
| [PRESENTASI.md](PRESENTASI.md) | Materi pitch lomba: fitur, angka bukti, slide deck |
| [docs/](docs/) | Peta situs dalam HTML dan PDF |
| [.env.example](.env.example) | Templat seluruh variabel environment |

---

## Stack

Next.js · React · TypeScript · Tailwind CSS · Framer Motion · Recharts · Leaflet ·
Lucide React · Neon Postgres · Cloudflare R2 · sharp
