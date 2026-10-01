import "server-only";
import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/csrf";

/** Batas default body JSON (100 KB umum; CMS memakai 1 MB). */
export const JSON_BODY_LIMIT = 100_000;
export const CMS_BODY_LIMIT = 1_000_000;

/** Tolak request mutasi yang bukan JSON atau tanpa Origin yang sah. */
export function guardMutation(
  request: Request,
  opts: { maxBytes?: number } = {}
): NextResponse | null {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
  }
  const method = request.method.toUpperCase();
  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type harus application/json." },
        { status: 415 }
      );
    }
    const maxBytes = opts.maxBytes ?? JSON_BODY_LIMIT;
    const declared = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(declared) && declared > maxBytes) {
      return NextResponse.json({ error: "Payload terlalu besar." }, { status: 413 });
    }
  }
  return null;
}

/** Baca + parse JSON dengan batas ukuran aktual (pertahanan lapis kedua). */
export async function readJsonLimited<T>(
  request: Request,
  maxBytes: number = JSON_BODY_LIMIT
): Promise<T | null> {
  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** IP client: entri pertama x-forwarded-for (di-set proxy), fallback "direct". */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first.slice(0, 64);
  return "direct";
}

/**
 * Throttle in-memory per kunci dengan batas keras (FIFO eviction).
 * Aman untuk single-instance; bukan pengganti rate-limit edge (Cloudflare),
 * tapi menutup banjir tulis dari satu IP/akun.
 */
export class MemoryThrottle {
  private buckets = new Map<string, { count: number; resetAt: number }>();
  constructor(
    private readonly maxKeys = 2000,
    private readonly limit = 30,
    private readonly windowMs = 60_000
  ) {}

  take(key: string): { allowed: boolean; retryAfter: number } {
    const now = Date.now();
    const entry = this.buckets.get(key);
    if (!entry || now >= entry.resetAt) {
      this.evictIfNeeded();
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, retryAfter: 0 };
    }
    entry.count += 1;
    if (entry.count > this.limit) {
      return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { allowed: true, retryAfter: 0 };
  }

  private evictIfNeeded(): void {
    if (this.buckets.size < this.maxKeys) return;
    // Hapus yang kedaluwarsa dulu; bila masih penuh, hapus tertua (FIFO).
    const now = Date.now();
    for (const [key, entry] of this.buckets) {
      if (now >= entry.resetAt) this.buckets.delete(key);
      if (this.buckets.size < this.maxKeys) return;
    }
    const oldest = this.buckets.keys().next();
    if (!oldest.done) this.buckets.delete(oldest.value);
  }
}
