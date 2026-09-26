/**
 * Unggah seluruh isi public/ (aset gambar & media) ke Cloudflare R2.
 * Jalankan: node --env-file=.env.local scripts/upload-assets-r2.mjs
 *
 * Key object = path relatif dari public/, contoh:
 *   public/assets/sekolah/sekolah-01-gedung.jpg -> assets/sekolah/sekolah-01-gedung.jpg
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname, sep } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error(
    "Kredensial R2 belum lengkap. Isi R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET di .env.local"
  );
  process.exit(1);
}

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
};

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const publicDir = new URL("../public", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const files = walk(publicDir);
console.log(`Mengunggah ${files.length} berkas dari public/ ke bucket "${R2_BUCKET}"...`);

let ok = 0;
let failed = 0;
for (const file of files) {
  const key = relative(publicDir, file).split(sep).join("/");
  const ext = extname(file).toLowerCase();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: readFileSync(file),
        ContentType: CONTENT_TYPES[ext] ?? "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    ok += 1;
    console.log(`  ok  ${key}`);
  } catch (error) {
    failed += 1;
    console.error(`  err ${key}: ${error.message}`);
  }
}

console.log(`Selesai. ${ok} berhasil, ${failed} gagal.`);
