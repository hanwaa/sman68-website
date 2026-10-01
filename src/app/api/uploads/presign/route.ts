import { NextRequest, NextResponse } from "next/server";
import { presignUpload, r2Configured, r2PublicUrl, safeKey } from "@/lib/r2";
import { requireAccount } from "@/lib/api-auth";
import { guardMutation, readJsonLimited, MemoryThrottle } from "@/lib/api-guard";
import { validateUpload } from "@/lib/upload-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kuota presign: 30/jam per akun (anti-abuse storage).
const presignThrottle = new MemoryThrottle(2000, 30, 3_600_000);

export async function POST(request: NextRequest) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  const limited = presignThrottle.take(`presign:${account.id}`);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan unggahan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  if (!r2Configured()) {
    return NextResponse.json(
      { error: "R2 belum dikonfigurasi. Isi R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY." },
      { status: 503 }
    );
  }

  const body = (await readJsonLimited<Record<string, unknown>>(request)) as Record<
    string,
    unknown
  > | null;

  const decision = validateUpload({
    folder: body?.folder,
    fileName: body?.fileName,
    contentType: body?.contentType,
    size: body?.size,
    role: account.role,
  });
  if (!decision.ok) {
    return NextResponse.json({ error: decision.error }, { status: decision.status });
  }

  // Content-Type ditandatangani dari ekstensi, bukan dari klaim client.
  const key = safeKey(decision.folder, String(body?.fileName));
  const uploadUrl = await presignUpload(key, decision.contentType, 600, decision.size);

  return NextResponse.json({ key, uploadUrl, publicUrl: r2PublicUrl(key) });
}
