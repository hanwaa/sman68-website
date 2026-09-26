import { NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import { r2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;
  let dbError: string | null = null;

  if (dbConfigured()) {
    try {
      await getDb()`select 1 as ok`;
      db = true;
    } catch (error) {
      dbError = error instanceof Error ? error.message : "Gagal terhubung ke database";
    }
  }

  return NextResponse.json({
    ok: db && r2Configured(),
    db: { configured: dbConfigured(), connected: db, error: dbError },
    r2: { configured: r2Configured() },
  });
}
