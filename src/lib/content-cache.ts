import "server-only";

/**
 * Cache server + singleflight untuk /api/content, dipakai bersama oleh
 * route content (baca) dan route admin/CMS (invalidasi).
 *
 * PENTING: state harus di modul lib bersama, bukan di modul route, karena
 * Next.js membundel tiap route terpisah sehingga state modul route tidak
 * berbagi antar-route (purge lintas-route tidak akan berfungsi).
 */

type ApiCacheEntry = { at: number; body: unknown; source: string };

/**
 * Hasil singleflight: data siap-pakai, BUKAN objek Response. Body Response
 * adalah ReadableStream yang hanya bisa dikonsumsi sekali; berbagi Response
 * antar-request membuat request kedua kena "ReadableStream is locked" (500).
 */
export type ContentPayload = { status: number; body: unknown };

const apiCache = new Map<string, ApiCacheEntry>();
const inflight = new Map<string, Promise<ContentPayload>>();

export const API_TTL_MS = 30_000;

export function getContentCache(resource: string): { body: unknown; source: string } | null {
  const hit = apiCache.get(resource);
  if (hit && Date.now() - hit.at < API_TTL_MS) {
    return { body: hit.body, source: hit.source };
  }
  return null;
}

export function setContentCache(resource: string, body: unknown, source: string): void {
  apiCache.set(resource, { at: Date.now(), body, source });
}

export function getInflight(resource: string): Promise<ContentPayload> | undefined {
  return inflight.get(resource);
}

export function setInflight(resource: string, task: Promise<ContentPayload>): void {
  inflight.set(resource, task);
}

export function clearInflight(resource: string, task: Promise<ContentPayload>): void {
  if (inflight.get(resource) === task) inflight.delete(resource);
}

/** Hapus cache /api/content (dipanggil setelah mutasi admin/CMS). */
export function purgeContentCache(resource?: string): void {
  if (resource) apiCache.delete(resource);
  else apiCache.clear();
}
