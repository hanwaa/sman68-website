export type UploadResult = { key: string; publicUrl: string | null };

/**
 * Unggah berkas langsung ke Cloudflare R2 via presigned URL.
 * Server hanya menandatangani; isi berkas tidak melewati server.
 */
export async function uploadToR2(file: File, folder: string): Promise<UploadResult> {
  const presign = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      folder,
      size: file.size,
    }),
  });

  if (!presign.ok) {
    const payload = (await presign.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Gagal menyiapkan unggahan ke R2.");
  }

  const { key, uploadUrl, publicUrl } = (await presign.json()) as {
    key: string;
    uploadUrl: string;
    publicUrl: string | null;
  };

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) throw new Error("Gagal mengunggah berkas ke R2.");

  return { key, publicUrl };
}

export function dataUrlToFile(dataUrl: string, fileName: string): File {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    throw new Error("Format gambar tidak valid.");
  }
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Format gambar tidak valid.");
  const meta = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  if (!base64 || base64.length > 15_000_000) {
    throw new Error("Ukuran gambar tidak valid.");
  }
  const mime = /data:([^;,]+)/.exec(meta)?.[1] ?? "image/jpeg";
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Error("Format gambar tidak valid.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}

/**
 * Unggah dataUrl gambar dengan fallback berlapis:
 * 1) PUT presigned langsung ke R2 (cepat, tanpa beban server),
 * 2) bila gagal (mis. CORS bucket belum mengizinkan origin situs),
 *    unggah lewat server POST /api/uploads.
 * Melempar Error dengan pesan yang bisa ditampilkan ke pengguna.
 */
export async function uploadDataUrlResilient(
  dataUrl: string,
  fileName: string,
  folder: string
): Promise<UploadResult> {
  const file = dataUrlToFile(dataUrl, fileName);
  let directError: unknown = null;
  try {
    return await uploadToR2(file, folder);
  } catch (error) {
    directError = error;
  }

  try {
    const res = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        folder,
        fileName,
        dataUrl,
      }),
    });
    const payload = (await res.json().catch(() => null)) as {
      key?: string;
      publicUrl?: string | null;
      error?: string;
    } | null;
    if (!res.ok) throw new Error(payload?.error ?? "Gagal menyimpan gambar di server.");
    if (!payload?.key) throw new Error("Respons server tidak valid.");
    return { key: payload.key, publicUrl: payload.publicUrl ?? null };
  } catch (serverError) {
    // Utamakan pesan server (lebih spesifik, mis. R2 belum dikonfigurasi);
    // bila server tak terjangkau, pakai pesan percobaan langsung.
    if (serverError instanceof Error) throw serverError;
    throw directError instanceof Error ? directError : new Error("Gagal menyimpan gambar.");
  }
}
