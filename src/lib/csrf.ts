/**
 * Pemeriksaan Origin untuk endpoint yang mengubah data (CSRF).
 *
 * Cookie sesi memakai SameSite=Lax sehingga browser tidak mengirimnya pada
 * POST lintas situs, tapi pemeriksaan Origin menutup jalur yang tidakcovered
 * SameSite (mis. subdomain SameSite atau browser lawas). Modul ini murni.
 *
 * Catatan keamanan: JANGAN percaya `x-forwarded-host` dari client, header
 * itu bisa di-spoof untuk mem-bypass perbandingan. Pakai `host` (yang di-set
 * oleh reverse proxy terpercaya) dan tolak bila kosong.
 */

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  // Hanya pakai `host` dari koneksi langsung/proxy terpercaya.
  // `x-forwarded-host` diabaikan karena dapat dikontrol penyerang.
  const host = request.headers.get("host");
  if (!host) return false;

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  return originHost === host.toLowerCase();
}
