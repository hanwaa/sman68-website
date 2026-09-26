#!/usr/bin/env bash
# Start Command untuk Webuzo Application Manager.
# Tombol "Start" di dashboard akan menjalankan skrip ini (mengendalikan PM2).
set -e
export PATH=/usr/local/apps/nodejs22/bin:/usr/bin:/bin:$PATH
cd "$(dirname "$0")/.."
pm2 startOrReload deploy/ecosystem.config.cjs
pm2 save
