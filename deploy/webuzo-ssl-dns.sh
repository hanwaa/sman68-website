#!/usr/bin/env bash
# ============================================================
# Terbitkan/perbarui sertifikat Let's Encrypt via DNS Cloudflare (acme.sh),
# lalu pasang ke path sertifikat yang dipakai vhost Webuzo.
#
# Jalankan di VPS:
#   sudo CF_Token=... CF_Zone_ID=... bash deploy/webuzo-ssl-dns.sh domain.com
#
# Token TIDAK boleh lewat argumen baris perintah — argv terlihat oleh
# `ps -ef` milik user lain dan tersimpan di riwayat shell. Beri lewat
# environment di atas, atau biarkan kosong lalu tempel saat diminta
# (input disembunyikan, tidak masuk riwayat).
#
# Token Cloudflare cukup permission: Zone → DNS → Edit (untuk zone domain tsb).
# CF_Zone_ID opsional — isi bila token dibatasi 1 zone agar acme.sh tak perlu cari zone.
# ============================================================
set -euo pipefail

DOMAIN="${1:?Pakai: sudo CF_Token=... bash deploy/webuzo-ssl-dns.sh domain.com}"
ZONE_ID="${CF_Zone_ID:-}"

# Token dari environment, atau prompt interaktif (read -s, tidak di-echo).
CF_TOKEN="${CF_Token:-}"
if [ -z "$CF_TOKEN" ]; then
  if [ ! -t 0 ]; then
    echo "!! CF_Token belum diisi dan stdin bukan terminal." >&2
    echo "   Jalankan: sudo CF_Token=<token> bash $0 $DOMAIN" >&2
    exit 1
  fi
  read -r -s -p "Token Cloudflare (Zone.DNS Edit): " CF_TOKEN
  echo
  [ -n "$CF_TOKEN" ] || { echo "!! Token kosong, dibatalkan." >&2; exit 1; }
fi

ACME="$(find /root /usr/local /opt -maxdepth 6 -name acme.sh -type f 2>/dev/null | head -1 || true)"
if [ -z "$ACME" ]; then
  echo "acme.sh tidak ditemukan. Install dulu:" >&2
  echo "  curl https://get.acme.sh | sh -s email=admin@$DOMAIN" >&2
  exit 1
fi
echo "==> acme.sh: $ACME"

export CF_Token="$CF_TOKEN"
if [ -n "$ZONE_ID" ]; then
  export CF_Zone_ID="$ZONE_ID"
  echo "==> Memakai CF_Zone_ID: $ZONE_ID"
fi

echo "==> Menerbitkan sertifikat $DOMAIN via DNS Cloudflare (CA: Let's Encrypt)"
"$ACME" --issue --server letsencrypt --dns dns_cf -d "$DOMAIN" --keylength ec-256

echo "==> Mencari path sertifikat yang dipakai vhost"
CONF="$(grep -RIlE -- "$DOMAIN" /usr/local/apps/*/conf /etc/nginx /etc/apache2 2>/dev/null | head -1 || true)"
CRT=""
KEY=""
if [ -n "$CONF" ]; then
  echo "    vhost: $CONF"
  CRT="$(grep -hE '^[[:space:]]*ssl_certificate[[:space:]]' "$CONF" 2>/dev/null | awk '{print $2}' | tr -d ';' | head -1 || true)"
  KEY="$(grep -hE '^[[:space:]]*ssl_certificate_key[[:space:]]' "$CONF" 2>/dev/null | awk '{print $2}' | tr -d ';' | head -1 || true)"
fi

if [ -n "$CRT" ] && [ -n "$KEY" ]; then
  echo "==> Pasang ke: $CRT  |  $KEY"
  "$ACME" --install-cert -d "$DOMAIN" --ecc \
    --key-file "$KEY" \
    --fullchain-file "$CRT" \
    --reloadcmd "systemctl reload nginx 2>/dev/null || systemctl reload httpd 2>/dev/null || systemctl reload lsws 2>/dev/null || systemctl restart lsws 2>/dev/null || true"
  echo "==> Selesai. Buka https://$DOMAIN"
else
  echo "!! Path sertifikat dari vhost tidak terdeteksi otomatis."
  echo "   1) Sertifikat sudah terbit. Salin isi file berikut ke panel Webuzo:"
  echo "      SSL → Create/Upload your own SSL Certificate"
  echo "      - Fullchain : ~/.acme.sh/${DOMAIN}_ecc/fullchain.cer"
  echo "      - Private   : ~/.acme.sh/${DOMAIN}_ecc/${DOMAIN}.key"
  echo "      - CA bundle : ~/.acme.sh/${DOMAIN}_ecc/ca.cer"
  echo "   2) Setelah panel menyimpan, catat path cert/key dari vhost lalu jalankan:"
  echo "      $ACME --install-cert -d $DOMAIN --ecc --key-file <key> --fullchain-file <crt> --reloadcmd 'systemctl reload nginx'"
fi

echo "==> Auto-renew: acme.sh sudah memasang cron otomatis (cek: crontab -l | grep acme)"
