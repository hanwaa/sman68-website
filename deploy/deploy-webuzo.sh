#!/usr/bin/env bash
# ============================================================
# Deploy/update app ke VPS Webuzo (Apache + PM2).
# Jalankan dari komputer lokal (root repo):
#   bash deploy/deploy-webuzo.sh
#
# Prasyarat: SSH key sudah dipasang (atau askpass untuk password).
# Override lewat env bila perlu:
#   VPS_HOST=101.50.1.15 VPS_PORT=50065 VPS_USER=root bash deploy/deploy-webuzo.sh
#   BUILD_CPUS=1 bash deploy/deploy-webuzo.sh   # bila ingin lebih hemat numproc
# ============================================================
set -euo pipefail

VPS_HOST="${VPS_HOST:-101.50.1.15}"
VPS_PORT="${VPS_PORT:-50065}"
VPS_USER="${VPS_USER:-root}"
APP_DIR="${APP_DIR:-/home/nazihan/sman68-app}"
SSH_OPTS=(-p "$VPS_PORT" -o StrictHostKeyChecking=accept-new)

cd "$(dirname "$0")/.."

LOCK_HASH="$(md5sum package-lock.json | cut -d' ' -f1)"

echo "==> Sinkron kode ke $VPS_USER@$VPS_HOST:$APP_DIR"
rsync -az --delete \
  -e "ssh ${SSH_OPTS[*]}" \
  --exclude node_modules --exclude .next --exclude logs --exclude .vercel \
  --exclude assets-origin --exclude .env.local --exclude tsconfig.tsbuildinfo \
  --exclude .DS_Store \
  ./ "$VPS_USER@$VPS_HOST:$APP_DIR/"

echo "==> Build & reload di VPS (lock=$LOCK_HASH)"
ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" \
  "APP_DIR='$APP_DIR' BUILD_CPUS='${BUILD_CPUS:-2}' bash '$APP_DIR/deploy/remote-deploy.sh' '$LOCK_HASH'"

echo
echo "==> Selesai. Cek: https://sman68-jkt.my.id"
