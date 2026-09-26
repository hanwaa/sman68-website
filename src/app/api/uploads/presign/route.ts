import { NextRequest, NextResponse } from "next/server";
import { presignUpload, r2Configured, r2PublicUrl, safeKey } from "@/lib/r2";
import { requireAccount } from "@/lib/api-auth";
import { validateUpload } from "@/lib/upload-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  if (!r2Configured()) {
    return NextResponse.json(
      { error: "R2 belum dikonfigurasi. Isi R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const decision = validateUpload({
    folder: body?.folder,
    fileName: body?.fileName,
    contentType: body?.contentType,
    size: body?.size,
  });
  if (!decision.ok) {
    return NextResponse.json({ error: decision.error }, { status: decision.status });
  }

  // Content-Type ditandatangani dari ekstensi, bukan dari klaim client.
  const key = safeKey(decision.folder, String(body?.fileName));
  const uploadUrl = await presignUpload(key, decision.contentType);

  return NextResponse.json({ key, uploadUrl, publicUrl: r2PublicUrl(key) });
}
