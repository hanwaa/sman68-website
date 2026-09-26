#!/usr/bin/env bash
# ============================================================
# Diagnosa SSL/challenge di server Webuzo (READ-ONLY, tidak mengubah apa pun).
# Jalankan di VPS:  sudo bash deploy/webuzo-ssl-diagnose.sh domain.com
# ============================================================
set -uo pipefail

DOMAIN="${1:?Pakai: sudo bash deploy/webuzo-ssl-diagnose.sh domain.com}"

section() { printf '\n== %s ==\n' "$1"; }

section "Web server yang aktif"
for s in nginx apache2 httpd lsws openlitespeed openresty varnish; do
  if systemctl is-active --quiet "$s" 2>/dev/null; then echo "aktif: $s"; fi
done
ss -ltnp 2>/dev/null | grep -E ':(80|443|3000)\b' || true

section "Isi /usr/local/apps"
ls -1 /usr/local/apps 2>/dev/null | grep -Ei 'nginx|apache|litespeed|openresty' || true

section "File konfigurasi yang menyebut domain"
CONFS="$(grep -RIlE -- "$DOMAIN" /usr/local/apps/*/conf /etc/nginx /etc/apache2 2>/dev/null | sort -u)"
if [ -z "$CONFS" ]; then
  echo "<tidak ada konfigurasi yang menyebut $DOMAIN>"
else
  echo "$CONFS"
fi

section "Cuplikan vhost (server_name / proxy / ssl / acme)"
while IFS= read -r c; do
  [ -z "$c" ] && continue
  echo "--- $c"
  grep -nE "server_name|ServerName|proxy_pass|acme-challenge|ssl_certificate" "$c" 2>/dev/null | head -20
done <<< "$CONFS"

section "Lokasi acme.sh"
find /root /usr/local /opt -maxdepth 6 -name acme.sh -type f 2>/dev/null | head -5

section "Challenge HTTP sekarang (harus 404 saat belum ada file)"
curl -sS -o /dev/null -w "http://%{remote_ip}%{url_effective} -> %{http_code}\n" \
  "http://$DOMAIN/.well-known/acme-challenge/uji-coba" 2>&1 || true
curl -sSI "http://$DOMAIN/" 2>/dev/null | head -3 || true

section "Sertifikat terpasang di :443"
echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates 2>/dev/null \
  || echo "belum ada SSL / port 443 tidak merespons"

section "DNS"
(getent ahosts "$DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u | head -6) || true
