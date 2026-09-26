import { NextRequest, NextResponse } from "next/server";
import { presignUpload, r2Configured, r2PublicUrl, safeKey } from "@/lib/r2";
import { requireAccount } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  if (!r2Configured()) {
    return NextResponse.json(
      { error: "R2 belum dikonfigurasi. Isi R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { fileName?: string; contentType?: string; folder?: string; size?: number }
    | null;

  const fileName = String(body?.fileName ?? "").trim();
  if (!fileName) {
    return NextResponse.json({ error: "fileName wajib diisi." }, { status: 400 });
  }
  if (body?.size && body.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran berkas melebihi 25 MB." }, { status: 413 });
  }

  const folder = String(body?.folder ?? "uploads");
  const contentType = String(body?.contentType ?? "application/octet-stream");
  const key = safeKey(folder, fileName);
  const uploadUrl = await presignUpload(key, contentType);

  return NextResponse.json({ key, uploadUrl, publicUrl: r2PublicUrl(key) });
}
