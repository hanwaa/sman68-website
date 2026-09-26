/**
 * Pemeriksaan Origin untuk endpoint yang mengubah data (CSRF).
 *
 * Cookie sesi memakai SameSite=Lax sehingga browser tidak mengirimnya pada
 * POST lintas situs, tapi pemeriksaan Origin menutup jalur yang tidakcovered
 * SameSite (mis. subdomain SameSite atau browser lawas). Modul ini murni.
 */

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  return originHost === host.toLowerCase();
}
