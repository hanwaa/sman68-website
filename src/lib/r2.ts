import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.R2_BUCKET ?? "sma68-website";
const publicBase = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");

export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
  );
}

let client: S3Client | null = null;

export function getR2(): S3Client {
  if (client) return client;
  if (!r2Configured()) {
    throw new Error(
      "Kredensial R2 belum lengkap (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)."
    );
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
  });
  return client;
}

/** Ubah key object R2 menjadi URL publik; key yang sudah berupa URL dibiarkan. */
export function r2PublicUrl(key?: string | null): string | null {
  if (!key) return null;
  if (/^https?:\/\//i.test(key)) return key;
  if (!publicBase) return null;
  return `${publicBase}/${key.replace(/^\/+/, "")}`;
}

export function safeKey(folder: string, fileName: string): string {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "") || "uploads";
  const dot = fileName.lastIndexOf(".");
  const rawBase = dot > 0 ? fileName.slice(0, dot) : fileName;
  const ext = dot > 0 ? fileName.slice(dot).toLowerCase() : "";
  const base =
    rawBase
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  return `${cleanFolder}/${Date.now().toString(36)}-${base}${ext}`;
}

export async function presignUpload(
  key: string,
  contentType: string,
  expiresIn = 600,
  contentLength?: number
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    // Enforce ukuran di sisi signature agar klaim `size` kecil tidak bisa
    // dipakai mengunggah file raksasa (kuota 25 MB di upload-policy).
    ...(Number.isFinite(contentLength) && (contentLength as number) > 0
      ? { ContentLength: contentLength as number }
      : {}),
  });
  return getSignedUrl(getR2(), command, { expiresIn });
}

/**
 * Unggah objek langsung dari server (fallback saat PUT presigned dari
 * browser diblokir, mis. CORS bucket belum mengizinkan origin situs).
 */
export async function putR2Object(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<void> {
  await getR2().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}
