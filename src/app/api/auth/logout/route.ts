import { NextRequest, NextResponse } from "next/server";
import { LEGACY_SESSION_COOKIE, SESSION_COOKIE } from "@/lib/auth-constants";
import { destroyAllSessions, destroySession } from "@/lib/auth-server";
import { guardMutation, readJsonLimited } from "@/lib/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Tolak logout lintas-origin (logout-CSRF memaksa korban keluar; juga
  // menutup pola serangan yang memakai logout sebagai langkah awal).
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  const token =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.cookies.get(LEGACY_SESSION_COOKIE)?.value;

  // ?all=1 atau { all: true } → keluar dari semua perangkat.
  let all = request.nextUrl.searchParams.get("all") === "1";
  if (!all) {
    const body = (await readJsonLimited<{ all?: boolean }>(request)) as {
      all?: boolean;
    } | null;
    all = body?.all === true;
  }

  if (token) {
    try {
      if (all) await destroyAllSessions(token);
      else await destroySession(token);
    } catch {
      /* sesi lokal tetap dihapus */
    }
  }

  const response = NextResponse.json({ ok: true });
  // Hapus kedua nama cookie (baru + legacy masa transisi).
  for (const name of [SESSION_COOKIE, LEGACY_SESSION_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
