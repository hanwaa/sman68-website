#!/usr/bin/env bash
# Dijalankan DI VPS oleh deploy-webuzo.sh (root).
# Argumen: <lock-hash package-lock.json>
set -euo pipefail
APP_DIR="${APP_DIR:-/home/nazihan/sman68-app}"
NODE_BIN="${NODE_BIN:-/usr/local/apps/nodejs22/bin}"
LOCK_HASH="${1:-none}"
BUILD_CPUS="${BUILD_CPUS:-2}"
LOCK_FILE="/home/nazihan/.sman68-lock-hash"

chown -R nazihan:nazihan "$APP_DIR"
if [ ! -f "$APP_DIR/.env.local" ]; then
  echo "!! .env.local belum ada di server." >&2
  exit 1
fi

sudo -u nazihan -H env PATH="$NODE_BIN:/usr/bin:/bin" APP_DIR="$APP_DIR" LOCK_HASH="$LOCK_HASH" BUILD_CPUS="$BUILD_CPUS" LOCK_FILE="$LOCK_FILE" bash -c '
  set -e
  cd "$APP_DIR"
  CURRENT=$(cat "$LOCK_FILE" 2>/dev/null || echo none)
  if [ "$CURRENT" != "$LOCK_HASH" ]; then
    echo "== npm ci (dependencies berubah) =="
    npm ci --no-audit --no-fund
    echo "$LOCK_HASH" > "$LOCK_FILE"
  else
    echo "== dependencies tidak berubah — skip npm ci =="
  fi
  echo "== build (${BUILD_CPUS} CPU, app distop sementara) =="
  pm2 stop sman68 >/dev/null 2>&1 || true
  NEXT_BUILD_CPUS="$BUILD_CPUS" npm run build
  pm2 start sman68 >/dev/null 2>&1 || pm2 start deploy/ecosystem.config.cjs
  pm2 save >/dev/null
'

sleep 2
curl -fsS http://127.0.0.1:30000/api/health
echo
