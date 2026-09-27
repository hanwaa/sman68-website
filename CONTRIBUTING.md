# Berkontribusi

Terima kasih mau membantu. Repo ini adalah situs resmi **SMA Negeri 68 Jakarta** —
kode orisinal, dipakai produksi, dan menyimpan data pribadi siswa. Karena itu
kontribusi yang diterima harus menjaga dua hal: **aplikasi tetap berjalan** dan
**tidak membocorkan data**.

Kontributor pertama sangat dibutuhkan. Kalau ini adalah PR pertama Anda ke
proyek open source, mulailah dari issue berlabel `good first issue` — semuanya
sudah dijelaskan stepwise di bawah.

## Menjalankan secara lokal

Butuh Node.js >= 20.9.0 dan PostgreSQL (Neon atau lokal).

```bash
npm install
cp .env.example .env.local      # isi minimal DATABASE_URL
node scripts/db-init.mjs        # terapkan db/schema.sql
npm run dev
```

Untuk banyak task (terutama unit test) Anda **tidak perlu** database — cukup
`npm install`.

## Sebelum mengirim PR

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src
npm test             # suite Node.js
```

Ketiganya harus lolos. Kalau gagal, perbaiki di PR Anda — jangan dilewati.

## Menambah unit test

Pola ini yang dipakai suite yang sudah ada (`tests/*.test.mjs`):

1. Tambahkan file sumber ke `include` di `tsconfig.tests.json`:

   ```json
   "include": [
     "src/lib/upload-policy.ts",
     "src/lib/remote-image.ts",
     "src/lib/csrf.ts",
     "src/lib/achievement-points.ts"
   ]
   ```

2. Buat `tests/achievement-points.test.mjs` yang mengimpor dari `.test-build`:

   ```js
   import test from "node:test";
   import assert from "node:assert/strict";
   import { achievementPoints } from "../.test-build/lib/achievement-points.js";

   test("poin mengikuti tingkat prestasi", () => {
     assert.equal(achievementPoints("nasional"), 75);
   });
   ```

3. `npm test` akan mengompilasi lalu menjalankannya. Nama test ditulis dalam
   bahasa Indonesia, konsisten dengan suite lain.

Fungsi yang **bersih dan murni** (tanpa database, tanpa I/O) adalah target
terbaik untuk test pertama. Lihat `src/lib/achievement-points.ts`,
`src/lib/utils.ts`, dan `src/lib/agenda.ts`.

## Gaya kode

Ikuti saja kode yang sudah ada — tidak perlu konfigurasi baru:

- **TypeScript ketat.** Hindari `any`; pakai tipe yang sudah ada di `src/lib`.
- **Komentar dan identifier boleh bahasa Indonesia**, konsisten dengan codebase.
  Ini disengaja, mohon dipertahankan.
- **Server-only.** Modul yang menyentuh database, R2, atau secret harus
  mengimpor `server-only` di baris pertama.
- **Debounce/RAF untuk kerja mahal.** Hentikan animasi saat keluar viewport.
- Jangan menambah dependency baru tanpa discussion dulu — repo ini sengaja
  dependency-light.

## soal data dan keamanan

- **Jangan pernah** commit `.env.local`, `deploy/deploy.env`, atau kredensial
  apa pun. Yang di-commit hanya `.env.example` dan `deploy/deploy.env.example`.
- Data di `db/schema.sql` adalah skema, bukan data siswa. Jangan masukkan NISN,
  nama, atau data nyata ke source, seed, atau test.
- Kalau menemukan vulnerability, **jangan buka issue publik**. Laporkan lewat
  GitHub Security Advisories (tab `Security` di repo) supaya bisa dipatch
  sebelum diumumkan.

## Submit

1. Fork repo ini, buat branch dari `main`.
2. Satu PR = satu perubahan. Jelaskan *apa* dan *mengapa*, plus cara memverifikasi.
3. Rujuk issue terkait dengan `Fixes #<nomor>`.
4. Tunggu review. Maintainer akan membalas; PR yang tidak aktif 30 hari ditutup.

Kalau ragu, buka issue dulu dan tanyakan — pertanyaan selalu welcome dan tidak
perlu malu.

## Lisensi

Kontribusi Anda dilisensikan dengan Lisensi MIT — lihat [LICENSE](LICENSE).
