import { NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import { r2Configured } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;

  if (dbConfigured()) {
    try {
      await getDb()`select 1 as ok`;
      db = true;
    } catch (error) {
      // Sengaja tidak mengembalikan pesan error driver (bisa memuat
      // host/user/detail koneksi), cukup status boolean; detail ada di log server.
      console.error("[health] database tidak terjangkau:", error instanceof Error ? error.message : error);
    }
  }

  // Respons generik: cukup `ok` untuk monitor/deploy. Detail kesiapan
  // infra (db/r2 configured/connected) tidak diekspos ke publik (recon).
  return NextResponse.json({ ok: db && r2Configured() });
}
