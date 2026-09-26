# Presentasi Lomba — Website SMAN 68 Jakarta

> Tagline: **Disiplin. Kreasi. Prestasi.**
> Live: <https://sman68-jkt.vercel.app>

---

## Pitch 30 Detik (Pembuka)

"Kami membangun website resmi SMAN 68 Jakarta yang bukan sekadar profil sekolah — tapi ekosistem digital yang **ramah untuk semua orang**, interaktif, dan terukur kualitasnya. Bukan template: desain editorial hijau khas sekolah, orbit 26 ekskul dengan logo asli, dashboard 3 peran, chatbot AI, dan mode disabilitas 10 opsi. Seluruhnya lolos audit aksesibilitas **100/100** dan SEO **100/100**."

---

## Fitur Utama

| Fitur | Nilai Jual |
|---|---|
| **Orbit Ekskul** | 26 logo ekskul asli mengorbit; hover → logo tampil di tengah; filter kategori; **klik planet → deep-link + highlight kartu** di halaman ekskul |
| **Mode Disabilitas** | 10 opsi: buta warna (merah→jingga), font disleksia, 3 level teks, matikan animasi (benar-benar menghentikan carousel & orbit), area sentuh 44px, kontras, grayscale, spasi luas, garis bawah tautan, fokus tegas — semua **tersimpan otomatis** |
| **Chatbot AI** | 17 topik (PPDB, ekskul, biaya, kontak, dll) + tombol aksi ke halaman terkait + timestamp + reset |
| **Dashboard 3 Peran** | Siswa / Guru / Admin: jadwal, agenda kalender interaktif, presensi, buku nilai, moderasi konten, manajemen user, pengumuman, prestasi — **semua tombol berfungsi nyata** |
| **Komunitas Alumni** | Kartu: nama, jurusan, fakultas, kampus + **tombol LinkedIn** dengan foto profil |
| **Guru & Staf** | Avatar foto + filter mapel + pencarian |
| **PPDB** | Panduan langkah interaktif (centang progres), timeline jadwal, FAQ |

---

## Angka Bukti

- **Accessibility Lighthouse: 100** di 5+ halaman (dashboard, ppdb, prestasi, ekskul, pengumuman)
- **SEO: 100** · **Best Practices: 100** · **CLS: 0–0.024** · **0 error console**
- Hydration error di /ppdb **diperbaiki** (sebelum 3 error → sesudah 0)
- Kontras footer 3.59:1 → **6.18:1** (lolos WCAG AA)
- Audit pakai Lighthouse + Playwright + **analisis piksel** (wave art terverifikasi 9–10% hijau)
- Responsive teruji 360/768/1024/1440, **0 overflow horizontal**

---

## Keamanan

- Security headers aktif: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
- **RLS (Row Level Security)** sudah dirancang di `supabase/schema.sql`: siswa hanya ubah data sendiri, berita hanya admin yang terbitkan
- Tidak ada kunci rahasia di kode; semua link eksternal `rel="noopener noreferrer"`
- Jujur: login masih demo (localStorage) → roadmap: Supabase Auth + RLS

---

## Slide Deck (12 Slide)

**Slide 1 — Judul**
- "Ekosistem Digital SMAN 68 Jakarta"
- Sub: *Disiplin. Kreasi. Prestasi.*
- Nama & kelas · URL: sman68-jkt.vercel.app

**Slide 2 — Masalah**
- Situs sekolah umumnya: template kaku, tak ramah disabilitas, tanpa interaksi
- Informasi tersebar (PPDB, ekskul, agenda) — orang tua & siswa kebingungan
- Tidak ada yang terukur: tanpa audit aksesibilitas, tanpa metrik kualitas

**Slide 3 — Solusi & Konsep**
- Website resmi dengan identitas hijau khas SMAN 68 (bukan template)
- Desain "editorial premium": tipografi besar, gelombang hijau, motion halus
- Satu pintu: publik + dashboard 3 peran dalam satu ekosistem

**Slide 4 — Orbit Ekskul (fitur bintang)**
- 26 ekskul dengan **logo asli** mengorbit seperti tata surya
- Hover → logo tampil di tengah; filter kategori
- **Klik planet → deep-link ke halaman ekskul + highlight kartu**

**Slide 5 — Dashboard 3 Peran**
- Siswa: jadwal, agenda kalender, pengumuman, prestasi (unduh sertifikat)
- Guru: presensi kelas, buku nilai, terbitkan pengumuman
- Admin: metrik + grafik, moderasi konten, kelola pengguna
- Semua tombol **benar-benar berfungsi**

**Slide 6 — Chatbot AI + Mode Disabilitas**
- Chatbot: 17 topik + tombol aksi ke halaman terkait
- Mode disabilitas **10 opsi**: buta warna, disleksia, teks besar, matikan animasi, area sentuh 44px, dll
- Preferensi tersimpan otomatis (localStorage)

**Slide 7 — Aksesibilitas Terukur**
- Lighthouse **100/100** di 5+ halaman
- WCAG 2.2 AA: skip-link, alt 100%, focus trap modal, target sentuh, kontras
- Animasi hormati `prefers-reduced-motion` + toggle manual

**Slide 8 — Kualitas Teknis**
- SEO 100 · Best Practices 100 · CLS 0–0.024 · **0 error console**
- 404 kustom, sitemap + robots, metadata dinamis per artikel
- Proses audit: Lighthouse + Playwright + analisis piksel

**Slide 9 — Keamanan**
- Security headers: anti-clickjacking, nosniff, referrer, permissions policy
- **Row Level Security** dirancang di schema (siswa hanya lihat datanya sendiri)
- Tanpa kunci rahasia di kode; link eksternal `noopener noreferrer`

**Slide 10 — Demo Langsung**

**Slide 11 — Roadmap**
- Auth asli (Supabase Auth + RLS) · data sekolah real · PWA/offline

**Slide 12 — Penutup**
- *"Bukan hanya website — ini komitmen kami pada semua pengguna."*
- Terima kasih · Live: sman68-jkt.vercel.app

---

## Script Kata-per-Kata (≈5 menit)

**Pembuka (0:00–0:30)**
"Selamat pagi, dewan juri. Perkenalkan, kami mempersembahkan website resmi SMAN 68 Jakarta dengan tagline *Disiplin, Kreasi, Prestasi*. Pertanyaan kami sederhana: mengapa website sekolah harus membosankan dan tidak ramah untuk semua orang? Hari ini kami tunjukkan jawabannya — bukan sekadar profil sekolah, tapi ekosistem digital yang inklusif, interaktif, dan terukur."

**Konsep (0:30–1:00)**
"Pertama, identitas. Kami membangun desain editorial dengan warna hijau khas sekolah — bukan template. Setiap elemen, dari tipografi sampai favicon, konsisten dengan identitas SMAN 68."

**Orbit Ekskul (1:00–1:45)**
"Sekarang fitur yang paling kami banggakan — orbit ekskul. 26 ekskul dengan logo aslinya mengorbit seperti tata surya. *(demo: arahkan kursor)* Perhatikan, logo ekskul muncul di tengah. *(demo: klik planet)* Dan ketika diklik, halaman ekskul terbuka dan kartunya otomatis tersorot. Ini detail kecil yang menunjukkan perhatian kami pada pengalaman pengguna."

**Aksesibilitas (1:45–2:45)**
"Namun yang paling penting: website ini dirancang untuk SEMUA orang. Kami punya mode disabilitas dengan sepuluh opsi. *(demo: aktifkan 'Ramah buta warna')* Penanda merah berubah menjadi jingga agar teman kita yang buta warna tetap bisa membedakan. *(demo: 'Font disleksia')* Font berubah menjadi lebih ramah disleksia. *(demo: 'Matikan animasi')* Dan perhatikan — bukan hanya CSS-nya yang berhenti, carousel dan orbit benar-benar berhenti berputar. Semua ini lolos audit Lighthouse dengan skor sempurna, 100 dari 100."

**Dashboard (2:45–3:30)**
"Kami juga membangun dashboard untuk tiga peran — siswa, guru, dan admin. *(demo: login satu klik → ganti peran)* Guru bisa membuka presensi dan buku nilai; admin bisa memoderasi konten dan mengelola pengguna. Semua tombol di sini berfungsi nyata, bukan pajangan."

**Kualitas & Keamanan (3:30–4:15)**
"Bagaimana kami memastikan kualitas? Kami tidak menebak — kami mengukur. SEO 100, pergeseran layout nyaris nol, dan nol error di konsol. Soal keamanan: kami aktifkan header keamanan, dan skema database kami sudah merancang *Row Level Security* — setiap pengguna hanya bisa mengakses datanya sendiri."

**Penutup (4:15–5:00)**
"Kami juga jujur: data saat ini masih demo, dan login asli akan terhubung ke Supabase. Karena bagi kami, lomba ini bukan akhir — ini langkah pertama. Website ini adalah bukti bahwa sekolah negeri bisa punya produk digital kelas dunia. *Disiplin. Kreasi. Prestasi.* Terima kasih."

---

## Cheat-Sheet Demo (urutan klik)

1. Beranda → scroll ke orbit → hover planet → **klik planet**
2. (kembali) → FAB kanan-bawah → **Chatbot** → klik chip "Biaya sekolah"
3. FAB → **Mode Disabilitas** → aktifkan "Ramah buta warna" + "Font disleksia" + "Matikan animasi"
4. `/login` → klik **Siswa** → sidebar "Agenda Sekolah" → geser bulan
5. Ganti ke **Guru** → "Buka Presensi Kelas" → tutup → "Buku Nilai"
6. Buka DevTools → Lighthouse (kalau sempat) → **100**

---

## Jawaban Juri yang Sering Muncul

| Pertanyaan | Jawaban |
|---|---|
| "Bedanya dengan template?" | Orbit interaktif + mode disabilitas 10 opsi + deep-link highlight — tidak ada di template manapun |
| "Backend-nya?" | Arsitektur siap integrasi Supabase (client + schema RLS sudah ada), data mock agar demo cepat |
| "Kenapa hijau?" | Identitas sekolah, konsisten dari token desain sampai favicon |
| "Login aman?" | Demo pakai localStorage; produksi: Supabase Auth + RLS |
| "Bisa kena XSS?" | React (Next.js) escape output otomatis; render server-side |
| "Data siswa bocor?" | Belum ada data asli; saat produksi RLS membatasi akses per pengguna |

---

## Kejujuran yang Menambah Nilai

- Statistik sekolah (siswa, guru, sarana, akreditasi) memakai **data resmi Dapodik Kemendikdasmen** — lihat bagian Sumber Data
- Nama guru/staf, nama Kepala Sekolah, dan klaim prestasi/alumni masih data demo → sampaikan sebagai "siap ditukar data asli"
- Belum PWA/offline, auth belum asli → roadmap 30 hari

## Sumber Data Resmi

- **Profil Sekolah Kita (Kemendikdasmen):** <https://sekolah.data.kemendikdasmen.go.id/profil-sekolah/0B39825A-6DE4-44BC-8742-7B06129634A8>
- Snapshot data tersimpan di `src/lib/school-data.ts` — dapat diperbarui dengan `node scripts/scrape-sekolah.mjs` (tambah `--foto` untuk mengunduh ulang foto resmi)
- Diakses: 21 September 2026 · NPSN 20100199 · Akreditasi A (Skor 96, BAN-SM 2022)

## Info Praktis

- **Live:** <https://sman68-jkt.vercel.app> · Favicon logo sekolah ✓
- Perubahan cepat: jalankan `npx vercel --prod --yes` → online <1 menit
