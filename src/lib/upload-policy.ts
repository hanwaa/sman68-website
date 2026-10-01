/**
 * Kebijakan unggahan berkas: folder, ekstensi, MIME, dan ukuran.
 *
 * Modul ini murni (tanpa I/O) supaya bisa diuji terpisah. Catatan keamanan:
 * Content-Type yang ditandatangani ke R2 selalu diambil dari ekstensi, bukan
 * dari klaim client. Kalau MIME tidak boleh (text/html, image/svg+xml, JS),
 * file ditolak, mencegah R2 menyajikan berkas yang dieksekusi peramban.
 */

export const UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

const DOCUMENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
};

/** Folder akar yang boleh dipakai unggahan CMS/porta. */
const FOLDER_ROOTS = ["uploads", "cms", "classroom", "absensi"] as const;

/** Akar folder yang hanya menerima gambar (bukan dokumen). */
const IMAGE_ONLY_ROOTS = new Set<string>(["absensi", "cms"]);

/** Akar folder yang hanya boleh ditulis admin (konten publik situs). */
const ADMIN_ONLY_ROOTS = new Set<string>(["cms"]);

const FOLDER_PATTERN = /^[a-z0-9][a-z0-9/_-]{0,48}$/;

export type UploadPolicyDecision =
  | { ok: true; folder: string; extension: string; contentType: string; size: number }
  | { ok: false; status: number; error: string };

export type UploadPolicyInput = {
  folder?: unknown;
  fileName?: unknown;
  contentType?: unknown;
  size?: unknown;
  /** Peran peminta, folder admin-only ditolak bila bukan admin. */
  role?: unknown;
};

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return "";
  return fileName.slice(dot).toLowerCase();
}

function normalizeMime(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.split(";")[0].trim().toLowerCase();
}

export function validateUpload({
  folder,
  fileName,
  contentType,
  size,
  role,
}: UploadPolicyInput): UploadPolicyDecision {
  const cleanFolder = typeof folder === "string" ? folder.trim().replace(/^\/+|\/+$/g, "") : "";
  const root = cleanFolder.split("/")[0];
  if (!cleanFolder || !FOLDER_PATTERN.test(cleanFolder) || cleanFolder.includes("..")) {
    return { ok: false, status: 400, error: "Folder unggahan tidak valid." };
  }
  if (!(FOLDER_ROOTS as readonly string[]).includes(root)) {
    return { ok: false, status: 400, error: "Folder unggahan tidak diizinkan." };
  }
  // Folder CMS menampung aset publik situs, siswa tidak boleh staging berkas di sana.
  if (ADMIN_ONLY_ROOTS.has(root) && role !== "admin") {
    return { ok: false, status: 403, error: "Folder ini hanya untuk admin." };
  }

  const name = typeof fileName === "string" ? fileName.trim() : "";
  if (!name) {
    return { ok: false, status: 400, error: "fileName wajib diisi." };
  }

  const extension = extensionOf(name);
  if (!extension) {
    return { ok: false, status: 400, error: "Ekstensi berkas wajib diisi." };
  }

  const imageOnly = IMAGE_ONLY_ROOTS.has(root);
  const allowed = imageOnly
    ? IMAGE_TYPES[extension]
    : IMAGE_TYPES[extension] ?? DOCUMENT_TYPES[extension];
  if (!allowed) {
    return {
      ok: false,
      status: 415,
      error: imageOnly
        ? "Folder ini hanya menerima gambar (jpg, png, webp, gif, avif)."
        : "Ekstensi berkas tidak diizinkan.",
    };
  }

  const claimed = normalizeMime(contentType);
  if (claimed && claimed !== allowed) {
    return {
      ok: false,
      status: 415,
      error: `Content-Type berkas harus ${allowed}.`,
    };
  }

  const bytes = typeof size === "number" ? size : Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return { ok: false, status: 400, error: "Ukuran berkas tidak valid." };
  }
  if (bytes > UPLOAD_MAX_BYTES) {
    return { ok: false, status: 413, error: "Ukuran berkas melebihi 25 MB." };
  }

  return { ok: true, folder: cleanFolder, extension, contentType: allowed, size: Math.trunc(bytes) };
}
