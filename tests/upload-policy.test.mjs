import test from "node:test";
import assert from "node:assert/strict";
import { UPLOAD_MAX_BYTES, validateUpload } from "../.test-build/lib/upload-policy.js";

const ok = (input) => {
  const result = validateUpload(input);
  assert.equal(result.ok, true, `.harus diterima: ${JSON.stringify(input)} → ${JSON.stringify(result)}`);
  return result;
};

const rejected = (input, status) => {
  const result = validateUpload(input);
  assert.equal(result.ok, false, `harus ditolak: ${JSON.stringify(input)}`);
  if (status) assert.equal(result.status, status);
  return result;
};

test("menerima gambar dengan folder dan MIME yang benar", () => {
  const result = ok({
    folder: "cms/news",
    fileName: "Robotika 2026.PNG",
    contentType: "image/png",
    size: 245_000,
    role: "admin",
  });
  assert.equal(result.folder, "cms/news");
  assert.equal(result.contentType, "image/png");
  assert.equal(result.extension, ".png");
});

test("MIME diturunkan dari ekstensi, bukan dari klaim client", () => {
  const result = ok({
    folder: "cms/ekskul",
    fileName: "kaguya cover.jpg",
    contentType: "image/jpeg; charset=binary",
    size: 1000,
    role: "admin",
  });
  assert.equal(result.contentType, "image/jpeg");
});

test("menolak contentType yang tidak cocok dengan ekstensi", () => {
  rejected(
    { folder: "cms/news", fileName: "a.png", contentType: "text/html", size: 10, role: "admin" },
    415
  );
  rejected(
    { folder: "cms/news", fileName: "a.png", contentType: "image/svg+xml", size: 10, role: "admin" },
    415
  );
});

test("menolak MIME berbahaya walau ekstensi Norman", () => {
  for (const fileName of ["xss.html", "xss.svg", "xss.js", "xss.php"]) {
    rejected({ folder: "classroom", fileName, contentType: "text/html", size: 10 });
  }
});

test("menolak path traversal dan folder di luar allowlist", () => {
  rejected({ folder: "../etc", fileName: "a.png", contentType: "image/png", size: 10 }, 400);
  rejected({ folder: "cms/../../etc", fileName: "a.png", contentType: "image/png", size: 10 }, 400);
  rejected({ folder: "rahasia", fileName: "a.png", contentType: "image/png", size: 10 }, 400);
  rejected({ folder: "", fileName: "a.png", contentType: "image/png", size: 10 }, 400);
});

test("folder cms dan absensi hanya menerima gambar", () => {
  rejected(
    { folder: "cms/absensi", fileName: "soal.pdf", contentType: "application/pdf", size: 10, role: "admin" },
    415
  );
  rejected({ folder: "absensi", fileName: "rekap.xlsx", contentType: "application/vnd.ms-excel", size: 10 }, 415);
  ok({ folder: "absensi", fileName: "selfie.jpg", contentType: "image/jpeg", size: 10 });
});

test("folder cms hanya untuk admin", () => {
  rejected(
    { folder: "cms/news", fileName: "a.png", contentType: "image/png", size: 10, role: "student" },
    403
  );
  rejected({ folder: "cms/news", fileName: "a.png", contentType: "image/png", size: 10 }, 403);
  ok({ folder: "cms/news", fileName: "a.png", contentType: "image/png", size: 10, role: "admin" });
});

test("folder classroom boleh menerima dokumen", () => {
  ok({ folder: "classroom", fileName: "Materi.pdf", contentType: "application/pdf", size: 2048 });
  ok({ folder: "classroom", fileName: "catatan.txt", contentType: "text/plain", size: 2048 });
});

test("menolak berkas tanpa ekstensi, ukuran invalid, dan kelewat besar", () => {
  rejected({ folder: "uploads", fileName: "tanpa-ekstensi", contentType: "image/png", size: 10 }, 400);
  rejected({ folder: "uploads", fileName: "a.png", contentType: "image/png", size: 0 }, 400);
  rejected({ folder: "uploads", fileName: "a.png", contentType: "image/png", size: -5 }, 400);
  rejected({ folder: "uploads", fileName: "a.png", contentType: "image/png", size: "besar" }, 400);
  rejected(
    { folder: "uploads", fileName: "a.png", contentType: "image/png", size: UPLOAD_MAX_BYTES + 1 },
    413
  );
});

test("hanya ekstensi terakhir yang menentukan jenis berkas", () => {
  const result = ok({
    folder: "uploads",
    fileName: "shell.php.png",
    contentType: "image/png",
    size: 10,
  });
  assert.equal(result.contentType, "image/png");
  rejected({ folder: "uploads", fileName: "a.exe", contentType: "application/octet-stream", size: 10 });
});
