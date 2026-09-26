#!/usr/bin/env bash
# Stop Command untuk Webuzo Application Manager.
# Tombol "Stop" di dashboard akan menjalankan skrip ini.
set -e
export PATH=/usr/local/apps/nodejs22/bin:/usr/bin:/bin:$PATH
cd "$(dirname "$0")/.."
pm2 stop sman68
