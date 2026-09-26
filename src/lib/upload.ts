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
  const [meta, base64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(meta)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}
