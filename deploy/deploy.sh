#!/usr/bin/env bash
# ============================================================
# Deploy / update app SMAN 68 di VPS.
# Jalankan dari root repo:  bash deploy/deploy.sh
# Migrasi schema DB (opsional):  RUN_DB_INIT=1 bash deploy/deploy.sh
# ============================================================
set -euo pipefail

APP_NAME="sman68"
BRANCH="${DEPLOY_BRANCH:-main}"

cd "$(dirname "$0")/.."

echo "==> Menarik kode terbaru (branch: $BRANCH)"
git fetch --prune origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

if [[ ! -f .env.local ]]; then
  echo "!! .env.local belum ada. Buat dulu (lihat DEPLOY-VPS.md) sebelum build." >&2
  exit 1
fi

echo "==> Install dependency (npm ci)"
npm ci

if [[ "${RUN_DB_INIT:-0}" == "1" ]]; then
  echo "==> Migrasi schema database"
  node --env-file=.env.local scripts/db-init.mjs
fi

echo "==> Build produksi"
npm run build

mkdir -p logs

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  echo "==> Reload PM2 (update env)"
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  echo "==> Start PM2"
  pm2 start deploy/ecosystem.config.cjs
fi
pm2 save

echo "==> Cek kesehatan app"
if curl -fsS "http://127.0.0.1:3000/api/health"; then
  echo
  echo "==> Deploy selesai."
else
  echo
  echo "!! Endpoint /api/health tidak merespons. Cek: pm2 logs $APP_NAME" >&2
  exit 1
fi
