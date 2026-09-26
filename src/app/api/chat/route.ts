import { NextResponse } from "next/server";

import { DEFAULT_CHIPS, ERROR_ANSWER } from "@/lib/chat-copy";
import { answerQuestion } from "@/lib/school-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LENGTH = 400;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

const buckets = new Map<string, { count: number; resetAt: number }>();

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
      for (const [existing, value] of buckets) {
        if (now > value.resetAt) buckets.delete(existing);
      }
    }
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  let payload: { message?: unknown };
  try {
    payload = await request.json();
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
    return NextResponse.json(await answerQuestion(raw));
  } catch (error) {
    console.error("[chat] gagal menjawab:", error);
    return NextResponse.json({
      answer: ERROR_ANSWER,
      chips: DEFAULT_CHIPS,
      intent: "error",
    });
  }
}
