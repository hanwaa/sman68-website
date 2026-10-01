import { NextRequest, NextResponse } from "next/server";
import { putR2Object, r2Configured, r2PublicUrl, safeKey } from "@/lib/r2";
import { requireAccount, safeErrorMessage } from "@/lib/api-auth";
import { guardMutation, readJsonLimited, MemoryThrottle } from "@/lib/api-guard";
import { UPLOAD_MAX_BYTES, validateUpload } from "@/lib/upload-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Body JSON membawa base64 (+-33% dari ukuran berkas). Batas 12 MB ≈ 9 MB berkas;
// selfie absen 480px biasanya < 300 KB.
const SERVER_BODY_LIMIT = 12_000_000;

// Kuota unggah via server: 30/jam per akun (sama seperti presign).
const uploadsThrottle = new MemoryThrottle(2000, 30, 3_600_000);

type UploadBody = {
  folder?: unknown;
  fileName?: unknown;
  dataUrl?: unknown;
};

/**
 * POST /api/uploads, unggah berkas kecil lewat server (fallback).
 * Dipakai saat PUT presigned langsung dari browser gagal (mis. CORS bucket R2
 * belum mengizinkan origin situs, atau jaringan ke R2 terhambat).
 * Kebijakan folder/ekstensi/ukuran sama dengan /api/uploads/presign.
 */
export async function POST(request: NextRequest) {
  const rejected = guardMutation(request, { maxBytes: SERVER_BODY_LIMIT });
  if (rejected) return rejected;
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  const limited = uploadsThrottle.take(`uploads:${account.id}`);
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

  const body = (await readJsonLimited<UploadBody>(request, SERVER_BODY_LIMIT)) as UploadBody | null;
  const dataUrl = typeof body?.dataUrl === "string" ? body.dataUrl : "";
  const comma = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:") || comma < 0) {
    return NextResponse.json({ error: "Format gambar tidak valid." }, { status: 400 });
  }
  const mime = /data:([^;,]+)/.exec(dataUrl.slice(0, comma))?.[1]?.toLowerCase() ?? "";
  const base64 = dataUrl.slice(comma + 1);
  if (!mime || !base64) {
    return NextResponse.json({ error: "Format gambar tidak valid." }, { status: 400 });
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(base64, "base64");
  } catch {
    return NextResponse.json({ error: "Format gambar tidak valid." }, { status: 400 });
  }
  if (bytes.length === 0 || bytes.length > UPLOAD_MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran berkas melebihi 25 MB." }, { status: 413 });
  }

  // MIME diambil dari isi dataUrl, bukan klaim client (prinsip yang sama
  // seperti presign: ekstensi harus cocok dengan isi).
  const decision = validateUpload({
    folder: body?.folder,
    fileName: body?.fileName,
    contentType: mime,
    size: bytes.length,
    role: account.role,
  });
  if (!decision.ok) {
    return NextResponse.json({ error: decision.error }, { status: decision.status });
  }

  const key = safeKey(decision.folder, String(body?.fileName));
  try {
    await putR2Object(key, bytes, decision.contentType);
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 502 });
  }

  return NextResponse.json({ key, publicUrl: r2PublicUrl(key) });
}
