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
APP_DIR="${APP_DIR:-/home/nazihan/sman68-app}"
NODE_BIN="${NODE_BIN:-/usr/local/apps/nodejs22/bin}"
LOCK_HASH="${1:-none}"
BUILD_CPUS="${BUILD_CPUS:-2}"
LOCK_FILE="/home/nazihan/.sman68-lock-hash"
HEALTH_URL="http://127.0.0.1:30000/api/health"
APP="sman68"

chown -R nazihan:nazihan "$APP_DIR"
if [ ! -f "$APP_DIR/.env.local" ]; then
  echo "!! .env.local belum ada di server." >&2
  exit 1
fi

sudo -u nazihan -H env PATH="$NODE_BIN:/usr/bin:/bin" \
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
