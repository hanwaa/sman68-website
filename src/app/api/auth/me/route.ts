import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Tidak ada sesi aktif." }, { status: 401 });
  }
  return NextResponse.json({ data: account });
}
