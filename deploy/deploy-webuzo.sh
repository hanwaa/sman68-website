#!/usr/bin/env bash
# ============================================================
# Deploy/update app ke VPS Webuzo (Apache + PM2).
# Jalankan dari komputer lokal (root repo):
#   bash deploy/deploy-webuzo.sh
#
# Prasyarat: SSH key sudah dipasang untuk $VPS_USER@$VPS_HOST.
#
# Konfigurasi server (IP, port, user, path) TIDAK disimpan di repo.
# Salin templat lalu isi:
#   cp deploy/deploy.env.example deploy/deploy.env
#
# Override per-pemanggilan tetap bisa:
#   BUILD_CPUS=1 bash deploy/deploy-webuzo.sh
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

# Muat deploy/deploy.env bila ada (tidak di-commit).
if [ -f deploy/deploy.env ]; then
  set -a
  # shellcheck disable=SC1091
  . deploy/deploy.env
  set +a
fi

# Semua nilai wajib dari environment — tidak ada default yang membocorkan
# host/user/path server ke dalam repo.
: "${VPS_HOST:?VPS_HOST belum diisi. Isi deploy/deploy.env atau export manual.}"
: "${VPS_USER:?VPS_USER belum diisi. Isi deploy/deploy.env atau export manual.}"
: "${APP_DIR:?APP_DIR belum diisi. Isi deploy/deploy.env atau export manual.}"
: "${APP_USER:?APP_USER belum diisi. Isi deploy/deploy.env atau export manual.}"
: "${LOCK_FILE:?LOCK_FILE belum diisi. Isi deploy/deploy.env atau export manual.}"
VPS_PORT="${VPS_PORT:-22}"
APP_PORT="${APP_PORT:-30000}"
# Worker build. Box ini punya 8 core dan ulimit -u 62987, jadi limit proses
# OpenVZ yang dulu jadi alasan memakai 1-2 CPU sudah tidak berlaku lagi.
# Pakai 4 supaya masih ada ruang untuk PM2, PostgreSQL, dan Apache. Override
# per-panggilan: BUILD_CPUS=1 bash deploy/deploy-webuzo.sh
BUILD_CPUS="${BUILD_CPUS:-4}"

SSH_OPTS=(-p "$VPS_PORT" -o StrictHostKeyChecking=accept-new)

LOCK_HASH="$(md5sum package-lock.json | cut -d' ' -f1)"

echo "==> Sinkron kode ke $VPS_USER@$VPS_HOST:$APP_DIR"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude node_modules --exclude .next --exclude logs --exclude .vercel \
  --exclude assets-origin --exclude .env.local --exclude deploy/deploy.env \
  --exclude tsconfig.tsbuildinfo --exclude .turbopack-cache \
  --exclude .DS_Store \
  ./ "$VPS_USER@$VPS_HOST:$APP_DIR/"

echo "==> Build & reload di VPS (lock=$LOCK_HASH)"
ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" \
  "APP_DIR='$APP_DIR' APP_USER='$APP_USER' LOCK_FILE='$LOCK_FILE' APP_PORT='$APP_PORT' BUILD_CPUS='$BUILD_CPUS' \
   bash '$APP_DIR/deploy/remote-deploy.sh' '$LOCK_HASH'"

echo
echo "==> Selesai."
