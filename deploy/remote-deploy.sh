#!/usr/bin/env bash
# Dijalankan DI VPS oleh deploy-webuzo.sh (root).
# Argumen: <lock-hash package-lock.json>
#
# Strategi: swap dua slot agar downtime ~1-2 detik, bukan 1-3 menit.
#   1. Kalau dependency berubah: stop → npm ci → start (build lama tetap utuh)
#   2. Build baru ditulis ke .next-new sementara app masih melayani dari .next
#   3. pm2 reload, lalu tukar .next ↔ .next-new
#   4. Kalau health check gagal, kembalikan .next-old
set -euo pipefail

# Konfigurasi server tidak hardcoded. Dua sumber, berurutan:
#   1. deploy/deploy.env di server (kalau ada)
#   2. environment yang diteruskan deploy-webuzo.sh
# APP_DIR wajib ada lebih dulu supaya file .env bisa dicari.
APP_DIR="${APP_DIR:-}"
if [ -n "$APP_DIR" ] && [ -f "$APP_DIR/deploy/deploy.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$APP_DIR/deploy/deploy.env"
  set +a
fi

: "${APP_DIR:?APP_DIR belum diisi. Jalankan lewat deploy/deploy-webuzo.sh atau export manual.}"
: "${APP_USER:?APP_USER belum diisi. Isi deploy/deploy.env di server atau export manual.}"
NODE_BIN="${NODE_BIN:-/usr/local/apps/nodejs22/bin}"
LOCK_HASH="${1:-none}"
BUILD_CPUS="${BUILD_CPUS:-2}"
: "${LOCK_FILE:?LOCK_FILE belum diisi. Isi deploy/deploy.env di server atau export manual.}"
APP_PORT="${APP_PORT:-30000}"
HEALTH_URL="http://127.0.0.1:${APP_PORT}/api/health"
APP="sman68"

chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
if [ ! -f "$APP_DIR/.env.local" ]; then
  echo "!! .env.local belum ada di server." >&2
  exit 1
fi

sudo -u "$APP_USER" -H env PATH="$NODE_BIN:/usr/bin:/bin" \
  APP_DIR="$APP_DIR" LOCK_HASH="$LOCK_HASH" BUILD_CPUS="$BUILD_CPUS" \
  LOCK_FILE="$LOCK_FILE" HEALTH_URL="$HEALTH_URL" APP="$APP" \
bash -c '
  set -e
  cd "$APP_DIR"

  wait_health() {
    for _ in $(seq 1 30); do
      if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then return 0; fi
      sleep 1
    done
    return 1
  }

  app_up() { pm2 describe "$APP" >/dev/null 2>&1; }

  # --- 1. Dependency (jarang; hanya saat package-lock.json berubah) ---
  CURRENT=$(cat "$LOCK_FILE" 2>/dev/null || echo none)
  if [ "$CURRENT" != "$LOCK_HASH" ]; then
    echo "== npm ci (dependencies berubah) =="
    if app_up; then pm2 stop "$APP" >/dev/null 2>&1 || true; fi
    npm ci --no-audit --no-fund
    echo "$LOCK_HASH" > "$LOCK_FILE"
    # Build lama masih utuh, jadi app bisa langsung naik lagi.
    pm2 start deploy/ecosystem.config.cjs >/dev/null 2>&1 || pm2 start "$APP" >/dev/null 2>&1
    wait_health || { echo "!! app tidak sehat setelah npm ci — deploy dibatalkan." >&2; exit 1; }
  else
    echo "== dependencies tidak berubah — skip npm ci =="
  fi

  # --- 2. Build ke slot baru, app tetap melayani dari .next ---
  echo "== build ke .next-new (${BUILD_CPUS} CPU, app tetap online) =="
  rm -rf .next-new
  # tsconfig ikut meng-glob .next/types, jadi validator dari build sebelumnya
  # masih terbaca dan akan menggagalkan build kalau ada route yang sudah
  # dihapus. Artefak ini hanya dipakai saat build, jadi aman dihapus dulu;
  # build baru akan membuat ulang di .next-new/types.
  rm -rf .next/types .next/dev/types

  # Cache Turbopack disimpan di <distDir>/cache/turbopack. Karena build ditulis
  # ke .next-new dan folder itu baru saja dihapus, cache selalu terbuang dan
  # setiap deploy jadi cold build. Salin cache dari build yang sedang aktif
  # supaya Turbopack memakai ulang hasil transformasi sebelumnya.
  #
  # Cache ini perlu disalin keluar dari .next TIDAK. Setelah swap, .next yang
  # baru sudah berisi cache tersebut, jadi deploy berikutnya membacanya dari
  # .next/cache seperti blok di atas. Versi lama menyalinnya ke
  # .turbopack-cache (~186 MB) tapi tidak pernah membacanya — sementara
  # rsync --delete juga menghapus folder itu tiap deploy karena tidak ada di
  # exclude list. Dua langkah sia-sia itu memakan ~370 MB I/O per deploy, dan
  # disk VPS ini hanya ~8 MB/s.
  if [ -d .next/cache ]; then
    mkdir -p .next-new/cache
    cp -r .next/cache/. .next-new/cache/ 2>/dev/null || true
  fi

  # Bersihkan sisa .turbopack-cache dari versi script lama.
  rm -rf "$APP_DIR/.turbopack-cache"

  NEXT_BUILD_CPUS="$BUILD_CPUS" NEXT_DIST_DIR=".next-new" npm run build
  [ -f .next-new/BUILD_ID ] || { echo "!! build tidak menghasilkan .next-new/BUILD_ID — dibatalkan." >&2; exit 1; }

  # --- 3. Swap: rename lama, pasang baru, reload ---
  echo "== swap .next ↔ .next-new + pm2 reload =="
  pm2 stop "$APP" >/dev/null 2>&1 || true
  rm -rf .next-old
  [ -d .next ] && mv .next .next-old
  mv .next-new .next
  pm2 reload deploy/ecosystem.config.cjs --update-env >/dev/null 2>&1 || pm2 start deploy/ecosystem.config.cjs >/dev/null 2>&1

  if wait_health; then
    rm -rf .next-old
    echo "== health OK — .next-old dibersihkan =="
  else
    echo "!! health check GAGAL — rollback ke build sebelumnya." >&2
    if [ -d .next-old ]; then
      rm -rf .next
      mv .next-old .next
      pm2 reload deploy/ecosystem.config.cjs --update-env >/dev/null 2>&1 || pm2 start deploy/ecosystem.config.cjs >/dev/null 2>&1
      if wait_health; then
        echo "== rollback berhasil, situs kembali ke build lama ==" >&2
      else
        echo "!! ROLLBACK GAGAL juga — cek manual: pm2 logs $APP" >&2
      fi
    else
      echo "!! tidak ada .next-old untuk rollback." >&2
    fi
    exit 1
  fi
  pm2 save >/dev/null
'

echo
curl -fsS "$HEALTH_URL" || true
echo
