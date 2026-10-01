# Deploy ke VPS (Ubuntu + Nginx + PM2)

Panduan migrasi dari Vercel ke VPS. Database tetap **Neon** dan penyimpanan aset tetap
**Cloudflare R2** — VPS hanya menjalankan aplikasi Next.js.

## Arsitektur

```
Browser ──https──> Nginx (VPS) ──http──> Next.js (PM2, 127.0.0.1:3000)
                        │                      │
                        │                      ├─> Neon Postgres (external)
                        │                      └─> Cloudflare R2 (upload via presigned URL, langsung dari browser)
```

Prasyarat:

- VPS Ubuntu 22.04 / 24.04, **minimal 2 GB RAM** (build Next butuh ±1.5 GB; kalau 1 GB
  wajib tambah swap 2 GB — lihat langkah 2).
- Domain yang mengarah ke IP VPS (A record `domain.com` dan `www` → IP VPS).
- Repo sudah di GitHub/GitLab (untuk `git pull` di server).

---

## 1. DNS

Di panel domain, buat:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `IP_VPS` |
| A | `www` | `IP_VPS` |

Tunggu propagasi (`dig +short domain.com` menampilkan IP VPS).

## 2. Setup awal VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw

# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # harus >= v20.9

# Swap 2 GB (wajib bila RAM 1 GB, disarankan selalu)
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# PM2 + logrotate
sudo npm install -g pm2
pm2 install pm2-logrotate

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## 3. Ambil kode & environment

> Folder proyek ini **belum berupa git repository**. Pilih salah satu:

**A. Via Git (disarankan, agar `deploy/deploy.sh` bisa `git pull`):**

```bash
# di komputer lokal
cd /path/ke/SMAN68-COPY
git init -b main && git add -A && git commit -m "Initial commit"
git remote add origin <URL_REPO_PRIVAT>   # GitHub/GitLab
git push -u origin main

# di VPS
sudo mkdir -p /var/www && sudo chown "$USER":"$USER" /var/www
git clone <URL_REPO_PRIVAT> /var/www/sman68
```

**B. Tanpa Git (sinkron dari lokal via rsync):**

```bash
# di komputer lokal
rsync -avz --delete \
  --exclude node_modules --exclude .next --exclude logs \
  --exclude .env.local --exclude .git --exclude assets-origin \
  /path/ke/SMAN68-COPY/ user@IP_VPS:/var/www/sman68/

# update berikutnya cukup ulangi perintah rsync di atas, lalu di VPS:
cd /var/www/sman68 && npm ci && npm run build && pm2 reload deploy/ecosystem.config.cjs --update-env
```

Lalu siapkan environment:

```bash
cd /var/www/sman68
cp .env.example .env.local
nano .env.local
```

Isi `.env.local` (nilai sama seperti di Vercel, kecuali `NEXT_PUBLIC_APP_URL`):

```env
DATABASE_URL=postgresql://...            # Neon (tidak berubah)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=sma68-website
R2_PUBLIC_BASE_URL=https://pub-....r2.dev
SEED_SECRET=...                          # opsional, hanya untuk seed manual
NEXT_PUBLIC_APP_URL=https://domain.com   # domain produksi Anda

# Instagram (opsional, sesuai yang aktif sekarang)
SCRAPECREATORS_API_KEY=...
INSTAGRAM_USERNAME=smanegeri68jakarta
```

> **Penting:** variabel `NEXT_PUBLIC_*` ikut ter-*compile* saat `npm run build`.
> Kalau nilainya berubah, wajib build ulang (`bash deploy/deploy.sh`).

## 4. Deploy pertama

```bash
cd /var/www/sman68
bash deploy/deploy.sh

# Jalankan app saat VPS reboot
pm2 startup systemd   # ikuti perintah yang dicetak, lalu:
pm2 save
```

Cek: `curl http://127.0.0.1:3000/api/health` → `{"ok":true,...}`.

Migrasi schema DB (bila perlu): `RUN_DB_INIT=1 bash deploy/deploy.sh`.

## 5. Nginx + SSL

```bash
sudo cp deploy/nginx-sman68.conf /etc/nginx/sites-available/sman68
sudo nano /etc/nginx/sites-available/sman68      # ganti domain
sudo ln -sf /etc/nginx/sites-available/sman68 /etc/nginx/sites-enabled/sman68
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Config Nginx sudah menyertakan `location ^~ /.well-known/acme-challenge/` agar challenge
HTTP-01 tidak ikut diproxy ke Next.js (ini penyebab umum error **404** saat penerbitan SSL).

### Opsi A — DNS-01 Cloudflare (paling andal, proxy boleh tetap ON)

Cocok karena domain Anda memakai Cloudflare; aman walau mode proxy (awan oranye) aktif,
dan bisa sekaligus wildcard.

```bash
sudo apt install -y certbot python3-certbot-dns-cloudflare
sudo mkdir -p /root/.secrets && sudo chmod 700 /root/.secrets
sudo tee /root/.secrets/cloudflare.ini >/dev/null <<'EOF'
dns_cloudflare_api_token = TOKEN_API_CLOUDFLARE   # Zone.DNS:Edit
EOF
sudo chmod 600 /root/.secrets/cloudflare.ini

sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  -d domain.com -d '*.domain.com'
sudo certbot renew --dry-run
```

### Opsi B — HTTP-01 webroot (tanpa token Cloudflare)

```bash
sudo mkdir -p /var/www/acme/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/acme

sudo apt install -y certbot
sudo certbot certonly --webroot -w /var/www/acme -d domain.com -d www.domain.com
sudo certbot renew --dry-run
```

Setelah sertifikat terbit, arahkan Nginx memakainya (Certbot `--nginx` versi Opsi B bisa
langsung; untuk Opsi A tambahkan blok `listen 443 ssl;` + `ssl_certificate`/`ssl_certificate_key`
di config site).

> **Kalau memakai aaPanel/panel lain:** error `404` pada URL
> `/.well-known/acme-challenge/...` berarti panel mem-proxy semua path ke Node.
> Pilih verifikasi **DNS** di menu SSL (provider Cloudflare + API token), atau tambahkan
> blok `location ^~ /.well-known/acme-challenge/` yang sama ke config site panel.
> Alias seperti `mail.domain.com` hanya boleh diminta jika DNS record-nya memang ada.

## 5b. Khusus Webuzo (SSL gagal `404` pada challenge)

Gejala: `Verify error ... Invalid response from http://domain/.well-known/acme-challenge/...: 404`.
Artinya request challenge sampai ke origin tapi tidak dilayani (karena vhost mem-proxy semua
path ke app Node / docroot tidak memuat file challenge).

Dua skrip bantu (jalankan di VPS dari root repo):

```bash
# 1) Diagnosa read-only — kirim outputnya kalau butuh bantuan lanjutan
sudo bash deploy/webuzo-ssl-diagnose.sh domain.com

# 2) Rekomendasi: terbitkan via DNS Cloudflare (tembus walau proxy ON, tanpa sentuh vhost)
#    Token lewat environment, JANGAN lewat argumen — argv terlihat di `ps -ef`
#    dan tersimpan di riwayat shell.
sudo env CF_Token=<CLOUDFLARE_API_TOKEN> CF_Zone_ID=<ZONE_ID> \
  bash deploy/webuzo-ssl-dns.sh domain.com
#    Kalau env tidak bisa diisi, jalankan tanpa CF_Token lalu tempel saat diminta
#    (inputnya disembunyikan dan tidak masuk riwayat).
```

Jika ingin tetap HTTP-01: tambahkan blok berikut pada **Custom VirtualHost Config** domain di
Webuzo (jangan edit file vhost hasil generate — akan tertimpa saat rebuild):

```nginx
location ^~ /.well-known/acme-challenge/ {
    root /home/<user>/public_html;
    default_type "text/plain";
    allow all;
}
```

lalu `mkdir -p /home/<user>/public_html/.well-known/acme-challenge` dan ulangi penerbitan
SSL dari panel. Hapus juga alias `mail.domain.com` dari permintaan sertifikat bila DNS-nya
tidak ada.

## 5c. Deploy aplikasi di Webuzo (Apache + PM2)

> Nilai server (IP, port SSH, nama user, path) sengaja tidak ditulis di dokumen ini.
> Simpan di `deploy/deploy.env` (sudah di-ignore git):

```bash
cp deploy/deploy.env.example deploy/deploy.env
$EDITOR deploy/deploy.env   # isi VPS_HOST, VPS_PORT, VPS_USER, APP_USER, APP_DIR, LOCK_FILE
```

Seluruh perintah di bawah memakai `<APP_USER>`, `<APP_DIR>`, `<VPS_HOST>`,
`<VPS_PORT>`, dan `<VPS_USER>` sebagai placeholder.

| Item | Nilai |
|---|---|
| Node/npm | `/usr/local/apps/nodejs22/bin` (bawaan Webuzo 22) |
| PM2 | dipasang global di prefix Node di atas |
| Direktori app | `<APP_DIR>` (user `<APP_USER>`) |
| Port app | `APP_PORT` (PM2 fork, `deploy/ecosystem.config.cjs`) |
| Reverse proxy | Dikelola **Webuzo Application Manager**: vhost generated otomatis `ProxyPass` ke port app. Tidak perlu file custom. |
| Graceful Apache | `/usr/local/apps/apache2/bin/httpd -k graceful` (unit `httpd.service` tidak mendukung `reload`) |

> Jika vhost Webuzo di-generate ulang oleh panel, proxy ke port app ikut ditulis ulang —
> karena itu app harus listen di port yang sama dengan `port` pada entry Application Manager.

Perintah build & jalankan (sebagai `<APP_USER>`):

```bash
sudo -u <APP_USER> -H env PATH=/usr/local/apps/nodejs22/bin:/usr/bin:/bin \
  bash -c 'cd <APP_DIR> && npm ci'

# Catatan: hentikan app & batasi worker build kalau boxnya memang punya limit
# proses kecil (mis. numproc 500 di OpenVZ lama). Di box sekarang nproc=8 dan
# ulimit -u=62987, jadi angka 1 tidak perlu lagi — pakai 4 supaya build tidak
# mengambil semua core. Kalau build gagal "spawn EAGAIN / pthread_create:
# Resource temporarily unavailable", turunkan ke 1.
sudo -u <APP_USER> -H env PATH=/usr/local/apps/nodejs22/bin:/usr/bin:/bin \
  bash -c 'cd <APP_DIR> && pm2 stop sman68; NEXT_BUILD_CPUS=4 npm run build; pm2 start sman68'

sudo -u <APP_USER> -H env PATH=/usr/local/apps/nodejs22/bin:/usr/bin:/bin \
  bash -c 'cd <APP_DIR> && pm2 save'
```

Auto-start saat boot:

```bash
env PATH=/usr/local/apps/nodejs22/bin:/usr/bin:/bin pm2 startup systemd -u <APP_USER> --hp <HOME_DIR>
# jalankan perintah yang dicetak, lalu simpan ulang:
sudo -u <APP_USER> -H env PATH=... pm2 save
```

### Update berikutnya (dari komputer lokal)

Cara yang dipakai: `deploy/deploy-webuzo.sh` — rsync + build jarak jauh, dengan
`.next-new` swap supaya downtime ±1–2 detik. Semua host/user/path dibaca dari
`deploy/deploy.env`:

```bash
bash deploy/deploy-webuzo.sh
```

`BUILD_CPUS` (default 4) mengatur `experimental.cpus` Next, jadi override
per-panggilan kalau perlu: `BUILD_CPUS=1 bash deploy/deploy-webuzo.sh`.

Setelan manual (kalau mau tanpa skrip):

```bash
rsync -az --delete \
  -e "ssh -p <VPS_PORT>" \
  --exclude node_modules --exclude .next --exclude logs --exclude .vercel \
  --exclude assets-origin --exclude .env.local --exclude deploy/deploy.env \
  --exclude tsconfig.tsbuildinfo --exclude .turbopack-cache \
  ./ <VPS_USER>@<VPS_HOST>:<APP_DIR>/

ssh -p <VPS_PORT> <VPS_USER>@<VPS_HOST> "chown -R <APP_USER>:<APP_USER> <APP_DIR> && \
  sudo -u <APP_USER> -H env PATH=/usr/local/apps/nodejs22/bin:/usr/bin:/bin \
  bash -c 'cd <APP_DIR> && npm ci && NEXT_BUILD_CPUS=4 npm run build && pm2 reload sman68 --update-env'"
```

> Ingat: `NEXT_PUBLIC_*` di-*bake* saat build — pastikan `.env.local` di server sudah benar
> sebelum build.

### Cloudflare Tunnel (akses panel & hostname yang diblok provider)

- Tunnel `sman68-vps` (connector `/etc/cloudflared/token.env`, service `cloudflared-sman68`).
- Ingress: `panel.*` → `localhost:2004`, `panel-user.*` → `localhost:2002`,
  `server.*`/`www.*`/`mail.*` → `localhost:80`.
- Kelola ingress via Dashboard (Zero Trust → Networks → Tunnels) atau API
  `PUT /accounts/{acc}/cfd_tunnel/{id}/configurations`.

## 6. Update berikutnya

```bash
cd /var/www/sman68
bash deploy/deploy.sh
```

Rollback cepat: `git log --oneline`, `git checkout <commit>`, lalu `bash deploy/deploy.sh`.

## 7. Checklist pasca-migrasi

- [ ] **R2 CORS**: tambahkan `https://domain.com` ke daftar origin yang diizinkan
      (Cloudflare Dashboard → R2 → bucket → Settings → CORS Policy) supaya fitur upload
      di dashboard admin tetap bisa `PUT` langsung ke R2.
- [ ] **DNS/propagasi** & sertifikat SSL aktif (`https://domain.com`).
- [ ] `.env.local` di VPS lengkap; app di-restart setelah mengubah env
      (`pm2 reload deploy/ecosystem.config.cjs --update-env`).
- [ ] Uji fitur kunci: `/berita` (Instagram highlight), `/tentang/fasilitas` (galeri),
      login admin, upload gambar di CMS, `/api/health`.
- [ ] Hapus `vercel.json` bila tidak dipakai lagi (opsional, tidak mengganggu).
- [ ] Pantau resource: `pm2 monit`, `free -h`, `df -h`.

## 8. Troubleshooting

| Gejala | Cek |
|--------|-----|
| 502 Bad Gateway | App mati → `pm2 status`, `pm2 logs sman68` |
| Build gagal / OOM | Tambah swap (langkah 2), ulangi build |
| Env terasa tidak terpakai | `pm2 reload deploy/ecosystem.config.cjs --update-env` (atau deploy ulang) |
| SSL gagal: `404 .../.well-known/acme-challenge/` | Challenge diproxy ke Next.js → pastikan blok `location ^~ /.well-known/acme-challenge/` ada, atau pakai verifikasi DNS Cloudflare |
| Upload R2 gagal dari admin | CORS bucket belum memuat domain baru |
| Error `sharp` saat gambar | `npm rebuild sharp` lalu deploy ulang |
| Sertifikat kedaluwarsa | `sudo certbot renew` (cron otomatis dari paket) |
| Cek log Nginx | `sudo tail -f /var/log/nginx/error.log` |
| Deploy lama (menit) | Lihat §8a — disk VPS ini hanya ~8 MB/s, jadi build didominasi I/O |

## 8a. Kenapa deploy terasa lambat

Diukur di VPS ini (OpenVZ di atas ploop/ext4, `df -T .` → `/dev/ploop*`):

```
dd if=/dev/zero of=/tmp/spd bs=1M count=200 conv=fsync   # 26,7 dtk = 7,8 MB/s
nproc                                                        # 8
ulimit -u                                                    # 62987
```

CPU dan RAM hampir nganggur saat deploy (2,9% / 12,7%), jadi lambatnya bukan
karena limit proses — murni I/O. Konsekuensinya, dua operasi besar per deploy
sangat mahal:

- `cp -r .next/cache` (cache Turbopack ±186 MB) → ±24 detik
- `rm -rf .next-old` (±213 MB) → ±25 detik

Yang sudah diperbaiki: versi lama `remote-deploy.sh` menyalin cache itu sekali
lagi ke `.turbopack-cache` (±186 MB) yang **tidak pernah dibaca**, sementara
 `rsync --delete` juga menghapus folder tersebut tiap deploy karena tidak ada
di `--exclude`. Jadi ada ±370 MB I/O sia-sia per deploy. Blok itu sudah dihapus
dan `--exclude .turbopack-cache` sudah ditambahkan.

`BUILD_CPUS` juga dinaikkan dari 2 ke 4 (`experimental.cpus` Next). Nilai 2
waris dari zaman box ini masih punya limit proses OpenVZ 500; sekarang
`ulimit -u` sudah 62.987.

Sisa waktu deploy dipakai oleh `next build` itu sendiri (sekitar 2 menit untuk
25 route, 15 di antaranya static di-generate). Kalau mau lebih cepat lagi,
kandidat terbesar adalah mengurangi jumlah route yang di-prerender saat build.

## 9. PostgreSQL lokal di VPS (pengganti Neon)

`src/lib/db.ts` & `scripts/db-init.mjs` memilih driver otomatis: host `*.neon.tech` → Neon
serverless; selain itu → `pg` Pool (`DB_POOL_MAX`, default 10). Rollback cukup ganti
`DATABASE_URL`.

```bash
apt-get install -y postgresql postgresql-contrib postgresql-client
# tuning: /etc/postgresql/16/main/conf.d/zz-sman68.conf
# listen_addresses='localhost', shared_buffers=256MB, max_connections=50, work_mem=4MB
# synchronous_commit=off, checkpoint_timeout=30min  # fsync disk ploop lambat (±1–2 dtk/commit)
PASS=$(openssl rand -hex 16); printf '%s' "$PASS" > /root/.sman68-db-pass; chmod 600 /root/.sman68-db-pass
sudo -u postgres psql -c "create role sman68 login password '$PASS'"
sudo -u postgres createdb -O sman68 sman68
```

> **Penting (VPS ini):** storage `ploop` OpenVZ punya fsync sangat lambat — commit menulis
> (login/sesi, absensi, CMS) bisa 1–3 dtk dan checkpoint menahan I/O sampai menit-menitan.
> Karena itu `synchronous_commit = off`: commit kembali ±1 ms, dengan trade-off transaksi
> paling akhir (beberapa ratus ms) bisa hilang bila OS/host crash — bukan korupsi DB.
> Tanpa ini, login saja ±2,5 dtk; setelah ini ±50 ms. Backup config ada di
> `zz-sman68.conf.bak-*` dan bisa dikembalikan dengan `pg_ctlcluster 16 main reload`.

Migrasi data (Neon ber-PG 18 → perlu client 18 dari repo PGDG; server lokal 16):

```bash
set -a; . <APP_USER_HOME>/.env.neon.bak; set +a
/usr/lib/postgresql/18/bin/pg_dump "$DATABASE_URL" --no-owner --no-privileges -Fc -f /root/sman68-neon.dump
PGPASSWORD=$(cat /root/.sman68-db-pass) /usr/lib/postgresql/18/bin/pg_restore \
  --no-owner --no-privileges -d "postgresql://sman68@127.0.0.1:5432/sman68" /root/sman68-neon.dump
```

- Error `unrecognized configuration parameter "transaction_timeout"` saat restore ke PG16 aman diabaikan.
- Switch: `.env.local` → `DATABASE_URL=postgresql://sman68:...@127.0.0.1:5432/sman68`, lalu `pm2 restart sman68`.
- Rollback: `cp <APP_USER_HOME>/.env.neon.bak <APP_DIR>/.env.local` → restart (kembali ke Neon).

Backup harian: `/usr/local/bin/sman68-db-backup.sh` via cron `/etc/cron.d/sman68-db-backup`
(02:30, retensi 7 hari) → `/var/backups/sman68/*.dump` + `latest.dump`.

Catatan: Webuzo tidak mengelola PostgreSQL apt ini (menu Databases panel hanya MySQL/MariaDB);
**jangan** pasang app PostgreSQL dari katalog Webuzo (cluster PG 13 terpisah, bentrok port 5432).
Query terberat terekam via `log_min_duration_statement=500` di `conf.d/zz-sman68.conf`.

## 10. Hardening numproc (OpenVZ, limit 500)

- `etc/extra/httpd-mpm.conf` (worker): `StartServers 2`, `MinSpareThreads 25`,
  `MaxSpareThreads 50`, `ThreadsPerChild 25`, `ServerLimit 4`, `MaxRequestWorkers 100`,
  `MaxConnectionsPerChild 5000`.
- `etc/conf.d/webuzo.conf`: `ServerLimit 4`, `MaxRequestWorkers 100` — tanpa ini Webuzo
  memaksa 256. Backup di `*.bak`; file ini bisa ditulis ulang oleh aksi panel Webuzo.
- Terapkan dengan **stop/start penuh** (`httpd -k stop && httpd -k start`);
  `httpd -k restart`/graceful **tidak** menurunkan `ServerLimit` (muncul warning
  `changing ServerLimit ... not allowed during restart`).
- Next: `images.minimumCacheTTL: 2592000` + header `Cache-Control` untuk `/api/content`
  di `next.config.mjs`.
- Cache Rule Cloudflare (dashboard): expression **hanya query sah** (paket Free — `matches`
  butuh Business):
  `(http.request.uri.path eq "/api/content" and http.request.uri.query in {"resource=news" ... 14 resource})`
  → Eligible for cache, Edge TTL ikuti origin. Jangan cache `/api/auth*`, `/api/admin*`,
  `/api/attendance*`, `/api/classroom*`, `/api/students*`.
- Cache Rule HTML anonim (lomba, via `cf` CLI — fase `http_request_cache_settings`,
  setelah rule `/api/content`): hanya `GET`/`HEAD`, bypass bila cookie berisi
  `sman68_session`, abaikan request RSC (`rsc: 1`):
  `path eq "/"` → Edge TTL override 300 dtk;
  `starts_with(path, "/berita"|"/prestasi"|"/tentang"|"/kehidupan"|"/ppdb"|"/akademik"|"/komunitas"|"/aksesibilitas"|"/kebijakan-privasi")`
  → Edge TTL override 600 dtk. `/login`, `/dashboard`, `/api/*` tetap DYNAMIC.
  Paket Free: custom cache key tidak entitled, jadi query unik tetap MISS (origin sanggup).
- Smart Tiered Cache: ON (`cf cache settings smart-tiered-cache edit --value on`).
- **Celah yang pernah ada**: flood cache-busting (`/api/content?resource=news&r=acak`) membuat
  Cloudflare mengantre MISS ~10–16 rps dengan stall 15 dtk + worker Apache habis (health timeout),
  padahal origin sendiri sanggup 801 rps untuk query unik. Setelah expression dibatasi daftar
  `in`, URL normal tetap `HIT`, URL ber-param tambahan jatuh ke jalur dinamis cepat:
  flood 100 konkuren → **776 rps, p50 116 ms, health 0 gagal**; varian encode (`%26`) → 400
  DYNAMIC 940 rps (aman).
- Hasil uji `ab` ke origin (c=50, 400 req): 0 gagal, p95 ±1,2–1,6 dtk, numproc puncak ±360/500.

### Hasil stress test lengkap (jalur lomba)

Origin (dari dalam VPS, kapasitas aplikasi):

| Endpoint | Konkurensi | Gagal | RPS | p95 |
|---|---|---|---|---|
| `/` | 50 | 0 | 324 | 1,0 dtk |
| `/` | 100 | 0 | 495 | 0,96 dtk |
| `/` | 150 | 0 | 529 | 0,30 dtk |
| `/api/health` (query DB) | 50 | 0 | 549 | 0,14 dtk |
| `/api/content?resource=news` | 50 | 0 | 565 | 0,11 dtk |

Lewat Cloudflare (dari luar):

| Endpoint | Konkurensi | Gagal | RPS | p50 / p95 | Cache |
|---|---|---|---|---|---|
| `/` | 50 | 0 | 305 | 128 / 305 ms | DYNAMIC |
| `/` | 100 | 0 | 349 | 204 / 514 ms | DYNAMIC |
| `/berita` | 50 | 0 | 338 | 81 / 296 ms | DYNAMIC |
| `/api/content?resource=news` | 50 | 0 | 716 | 33 / 226 ms | 498/500 HIT |
| `/api/content?resource=news` | 100 | 0 | 748 | 52 / 373 ms | 500/500 HIT |
| `/api/health` | 50 | 0 | 402 | 71 / 237 ms | DYNAMIC |
| `POST /api/auth/login` (scrypt) | 25 | 0 | 70 | — / 485 ms | — |
| `POST /api/auth/login` (scrypt) | 50 | 0 | 81 | — / 985 ms | — |

- `numproc` puncak selama seluruh uji: **382/500**, RAM ±800 MB — aman.
- **Penting — scrypt harus async**: `scryptSync` (N=16384, ±40 ms) memblokir event loop Node.
  Sebelum perbaikan, burst login c=25 hanya 15 rps dan menahan endpoint lain hingga **2 dtk**.
  Setelah `scrypt` async + `UV_THREADPOOL_SIZE=8` (di `deploy/ecosystem.config.cjs`):
  70–81 rps dan endpoint lain tetap p95 7–49 ms. Jangan kembalikan ke `scryptSync`.
- **Downtime saat deploy**: siklus stop → build hangat → start ±**7 dtk** (build terkena cache);
  deploy penuh dengan perubahan kode + `npm ci` ±2–4 menit. Jangan deploy saat jam lomba.

### Uji ulang pasca-hardening (origin tertutup, apex via tunnel)

- Origin (dari dalam VPS): beranda c=150 → **625 rps** p95 243 ms; `/api/health` c=50 → 715 rps
  p95 94 ms; `/api/content` c=50 → 698 rps p95 97 ms; load CPU <0,4 dari 8 vCPU.
- Cloudflare (dari luar): beranda cache-bust 366 rps; 404 flood 874 rps; API cache-bust 667 rps;
  health query unik 408 rps; **multi-vektor 4×50 ≈ 660 rps agregat** — semua 0 gagal,
  health 0 non-200, numproc ≤365/500, load ≤0,82, RAM ≤955 MB.
- Login: c=25/50/100 → 78–80 rps, **0 gagal** (p95 0,4–1,5 dtk), load puncak 5,25/8 vCPU.
- **`max_memory_restart` 700M → 1500M**: pada 700M, burst login membuat RSS menembus batas →
  PM2 restart + 9 request gagal & health drop sesaat. Setelah 1500M: 0 gagal,
  RSS puncak ±305 MB (RAM total terpakai ≤736 MB).
- **Mode lomba** (`deploy/ecosystem.config.cjs`): `instances: 2`, `exec_mode: cluster`,
  `max_memory_restart: 700M` per instance (RAM VPS 4 GB, available ±3,3 GB — butuh ±600 MB).
  Terapkan via `pm2 reload sman68` (zero-downtime, bukan restart). Batas proses OpenVZ 500:
  +1 instance ≈ +12 thread, aman dari puncak 382 — jangan naikkan ke 3+ tanpa cek ulang.
  ISR halaman publik `revalidate` 60 → 300 (CMS publish tetap refresh instan via
  `revalidatePath`, jadi tanpa risiko konten basi).
- **Jebakan `pm2 reload`**: reload TIDAK menerapkan perubahan `exec_mode`/`instances`
  (fork→cluster, 1→2 instance). Kalau dua nilai itu berubah, wajib
  `pm2 delete sman68 && pm2 start deploy/ecosystem.config.cjs` sekali, lalu
  `pm2 save`. Deploy berikutnya cukup reload karena topologi berjalan sudah cluster.
- **Throttle login vs juri (tanpa rubrik, pilih aman)**: `LOGIN_IP_LIMIT_PER_MIN`
  (default 30/menit/IP, in-memory per proses PM2 — cluster 2 instance ≈ 2× nilai).
  Lockout per-username (5 gagal → kunci 15 mnt) tetap aktif sebagai proteksi brute-force
  yang sebenarnya. Saat window lomba: `LOGIN_IP_LIMIT_PER_MIN=300` + `pm2 reload sman68`
  (tanpa rebuild); setelah lomba, hapus env-nya dan reload lagi. Jangan lupa deploy ulang
  dari repo terbaru agar perilaku sama dengan yang diuji (limit lama yang ter-deploy
  tampak lebih rendah dari 30).
- **Penting**: akses langsung ke IP origin dari internet publik di-reset provider saat burst
  (proteksi koneksi massal). Uji beban harus lewat domain/Cloudflare — jalur yang memang dipakai.

## 11. SEO

- **Satu sumber domain**: `NEXT_PUBLIC_APP_URL` (fallback `src/lib/seo.ts` →
  `https://sman68-jkt.my.id`). Semua canonical, OG, sitemap, robots, JSON-LD ikut otomatis.
- `buildMetadata()` di `src/lib/seo.ts`: canonical + OG + Twitter per halaman.
  Artikel berita memakai `og:type=article`, `publishedTime`, `authors`.
- **JSON-LD** (`src/lib/schema.ts` + `JsonLd`): `School` & `WebSite` (layout),
  `NewsArticle` + `BreadcrumbList` (artikel), `FAQPage` (PPDB FAQ),
  `BreadcrumbList` (berita/prestasi/ekskul/galeri).
- **OG image statis**: `public/assets/og-default.png` (1200×630). Regenerate bila logo berubah:
  `node scripts/generate-og.mjs`.
- **Listing ter-render server** (SEO): `getNews/getAchievements/getEkskul/getGallery/getFaqs`
  di `src/lib/content-server.ts`, dikirim sebagai `initialData` ke komponen client;
  halaman memakai `revalidate` 300–3600 dtk.
- `robots.txt` (disallow `/dashboard`, `/login`, `/api/`) + `X-Robots-Tag: noindex` untuk
  `/api/*` di `next.config.mjs`; `manifest.webmanifest` di `src/app/manifest.ts`.
- Verifikasi Google Search Console (properti Domain `sman68-jkt.my.id`, DNS TXT) lalu
  submit `https://sman68-jkt.my.id/sitemap.xml`; Bing bisa impor dari GSC.

### Checklist migrasi domain (pasca-lomba, mis. ke `sman68jkt.sch.id`)

1. Tambah domain di Webuzo/DNS + ingress Cloudflare Tunnel + terbitkan sertifikat
   (acme.sh DNS-01) untuk domain baru.
2. Ubah `NEXT_PUBLIC_APP_URL=https://domain-baru` di `.env.local` → `pm2 restart sman68`
   (canonical/OG/sitemap/robots otomatis pindah).
3. Redirect **301** domain lama → domain baru di Cloudflare Redirect Rules.
4. Buat properti baru di Google Search Console, submit sitemap baru, pantau Coverage.
5. `node scripts/generate-og.mjs` (teks domain di OG) lalu deploy ulang.

## 12. Ketahanan operasional (hari lomba)

- **Autostart reboot**: unit systemd `pm2-<APP_USER>` `enabled` → `pm2 resurrect` memulai app dari
  dump saat boot. Diuji `pm2 kill` + `systemctl start pm2-<APP_USER>`: downtime **±1,7 dtk**.
  Jalankan `pm2 save` setiap kali mengubah konfigurasi proses.
- cloudflared (`Restart=always`), PostgreSQL, Webuzo, Apache semuanya aktif saat boot.
- Swap: OpenVZ hanya menyediakan vswap (`/dev/null`) — **tidak ada swap nyata**, hindari build
  bersamaan beban puncak.
- Jangan deploy/build saat lomba: stop → build hangat → start ±7 dtk 503; deploy penuh ±2–4 menit.
- Rekomendasi di luar server: uptime monitor eksternal (cek `/api/health` tiap 1–5 menit),
  Rate limiting Cloudflare untuk `/api/auth/login` (10 req/10 dtk/IP), rotasi password root.
- **Rate limit login CF aktif** (paket Free): `URI Path equals /api/auth/login`,
  10 request / 10 detik per IP+colo, aksi **Block** 10 detik. Terverifikasi: request ke-14
  dari IP yang sama kena `429`, endpoint lain tetap `200`, normal lagi setelah 10 dtk.
- **MySQL tidak terekspos publik**: `bind-address = 127.0.0.1` di `/etc/my.cnf`
  (backup `my.cnf.bak-*`), MariaDB restart, panel Webuzo tetap normal. Koneksi luar ke
  3306 menggantung tanpa handshake MySQL (proxy provider, bukan server kita).
- **Origin tidak bisa diakses langsung (anti direct-IP flood)**:
  - Apache hanya listen loopback: `Listen 127.0.0.1:80` & `Listen 127.0.0.1:443`
    di `conf.d/webuzo.conf` (backup `webuzo.conf.bak-listen-*`).
  - Apex dipindah dari A→IP origin menjadi **CNAME ke Cloudflare Tunnel**
    (`<TUNNEL_ID>.cfargotunnel.com`), ditambah ingress `sman68-jkt.my.id → localhost:80`.
  - Verifikasi: `http(s)://<VPS_HOST>` timeout dari luar; domain tetap 200 lewat tunnel.
  - **Catatan**: aksi panel Webuzo bisa menulis ulang `webuzo.conf`/DNS; jika itu terjadi,
    ulangi langkah di atas. Saat transisi, edge CF sempat menyajikan `525` dari cache —
    sembuh ≤10 menit (TTL) atau purge via dashboard.
- **`iptables` tidak difilter di container OpenVZ ini** — rule terpasang tapi trafik luar
  tetap tembus. Jangan andalkan firewall lokal; proteksi port lewat bind service/provider.
- **Kebocoran IP via MX `_dc-mx...` SELESAI**: setelah apex dipindah ke CNAME tunnel,
  `_dc-mx.<suffix>` ikut mengarah ke tunnel (bukan lagi `<VPS_HOST>`). Sapuan semua nama
  (apex, www, ftp, mail, server, panel, panel-user, `_dc-mx`, ns1, ns2, subdomain acak)
  tidak ada yang menunjuk IP origin; port 53 publik VPS tidak menyajikan zona BIND internal.
  Implikasi: MX kini mengarah ke Cloudflare, jadi email `@sman68-jkt.my.id` tidak lagi masuk
  ke Webuzo — pakai Cloudflare Email Routing bila email diperlukan.

Catatan: jangan menjalankan `npm run dev` di server produksi — pakai PM2 seperti di atas.
