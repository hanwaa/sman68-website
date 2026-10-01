import { NextResponse } from "next/server";

import { DEFAULT_CHIPS, ERROR_ANSWER } from "@/lib/chat-copy";
import { answerQuestion } from "@/lib/school-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LENGTH = 400;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

const buckets = new Map<string, { count: number; resetAt: number }>();

// Cache jawaban 5 menit per pesan ternormalisasi: pertanyaan populer yang
// diulang puluhan pengunjung (mis. "jadwal ppdb") dijawab tanpa fan-out
// DB + pencarian eksternal. Kunci = pesan kecil (<=400 char), aman di memori.
const answerCache = new Map<string, { at: number; body: unknown }>();
const ANSWER_TTL_MS = 5 * 60_000;
const ANSWER_CACHE_MAX = 500;

function normalizeMessage(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ").slice(0, MAX_LENGTH);
}

function getCachedAnswer(key: string): unknown | null {
  const hit = answerCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ANSWER_TTL_MS) {
    answerCache.delete(key);
    return null;
  }
  return hit.body;
}

function setCachedAnswer(key: string, body: unknown): void {
  answerCache.set(key, { at: Date.now(), body });
  if (answerCache.size > ANSWER_CACHE_MAX) {
    const now = Date.now();
    // Hapus yang kedaluwarsa dulu; bila masih penuh, hapus tertua (FIFO)
    // agar ukuran selalu kembali ke batas (sebelumnya bisa tumbuh tanpa batas
    // bila semua entry masih segar).
    for (const [existing, entry] of answerCache) {
      if (now - (entry as { at: number }).at > ANSWER_TTL_MS) answerCache.delete(existing);
      if (answerCache.size <= ANSWER_CACHE_MAX) break;
    }
    while (answerCache.size > ANSWER_CACHE_MAX) {
      const oldest = answerCache.keys().next();
      if (oldest.done) break;
      answerCache.delete(oldest.value);
    }
  }
}

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > 5000) {
      // Sweep kedaluwarsa; bila masih penuh (IP unik segar), eviksi FIFO
      // agar tidak menjadi DoS memori via header spoof.
      for (const [existing, value] of buckets) {
        if (now > value.resetAt) buckets.delete(existing);
        if (buckets.size <= 5000) break;
      }
      while (buckets.size > 5000) {
        const oldest = buckets.keys().next();
        if (oldest.done) break;
        buckets.delete(oldest.value);
      }
    }
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 415 });
  }
  let payload: { message?: unknown };
  try {
    const text = await request.text();
    if (text.length > 10_000) {
      return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 413 });
    }
    payload = JSON.parse(text) as { message?: unknown };
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const raw = typeof payload.message === "string" ? payload.message.trim() : "";
  if (!raw) {
    return NextResponse.json({ error: "Pesan kosong." }, { status: 400 });
  }
  if (raw.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `Pesan maksimal ${MAX_LENGTH} karakter.` },
      { status: 400 }
    );
  }

  if (rateLimited(clientKey(request))) {
    return NextResponse.json(
      { answer: ERROR_ANSWER, chips: DEFAULT_CHIPS, intent: "rate-limit" },
      { status: 429 }
    );
  }

  try {
    const cacheKey = normalizeMessage(raw);
    const cached = getCachedAnswer(cacheKey);
    if (cached) return NextResponse.json(cached);
    const answer = await answerQuestion(raw);
    // Jangan cache jawaban error/rate-limit agar kondisi pulih langsung terasa.
    if (
      answer &&
      typeof answer === "object" &&
      (answer as { intent?: string }).intent !== "error" &&
      (answer as { intent?: string }).intent !== "rate-limit"
    ) {
      setCachedAnswer(cacheKey, answer);
    }
    return NextResponse.json(answer);
  } catch (error) {
    console.error("[chat] gagal menjawab:", error);
    return NextResponse.json({
      answer: ERROR_ANSWER,
      chips: DEFAULT_CHIPS,
      intent: "error",
    });
  }
}
