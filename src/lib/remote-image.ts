/**
 * Allowlist host untuk gambar OG yang diambil server-side.
 *
 * motivations SSRF: /api/og menerima URL dari query string lalu fetch dari
 * server. Tanpa allowlist, penyerang bisa membuat server mengambil URL internal
 * (metadata cloud, localhost, jaringan privat) dan membocorkan isinya lewat
 * gambar hasil render. Modul ini murni supaya bisa diuji.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data",
]);

function isIpLiteral(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

export type RemoteImageDecision = { ok: true; url: URL } | { ok: false; reason: string };

export function checkRemoteImage(
  raw: string,
  allowedHosts: readonly string[]
): RemoteImageDecision {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "URL tidak valid." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "Hanya URL https yang diizinkan." };
  }

  const hostname = url.hostname.toLowerCase();
  if (!hostname) {
    return { ok: false, reason: "Host tidak valid." };
  }
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".local")) {
    return { ok: false, reason: "Host internal tidak diizinkan." };
  }
  if (isIpLiteral(hostname) && isPrivateIpv4(hostname)) {
    return { ok: false, reason: "Alamat IP privat tidak diizinkan." };
  }

  const hosts = allowedHosts.map((host) => host.toLowerCase()).filter(Boolean);
  if (!hosts.includes(hostname)) {
    return { ok: false, reason: "Host gambar tidak ada di allowlist." };
  }

  return { ok: true, url };
}
