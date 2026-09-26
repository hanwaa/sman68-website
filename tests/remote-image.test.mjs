import test from "node:test";
import assert from "node:assert/strict";
import { checkRemoteImage } from "../.test-build/lib/remote-image.js";

const HOSTS = ["sman68-jkt.my.id", "pub-8156d70781324453bda28e90108800f1.r2.dev"];
const allowed = (raw) => {
  const result = checkRemoteImage(raw, HOSTS);
  assert.equal(result.ok, true, `harus diizinkan: ${raw} → ${JSON.stringify(result)}`);
  return result;
};
const blocked = (raw) => {
  const result = checkRemoteImage(raw, HOSTS);
  assert.equal(result.ok, false, `harus ditolak: ${raw}`);
  return result;
};

test("menerima host milik sendiri dan host R2", () => {
  allowed("https://sman68-jkt.my.id/assets/hero-1.png");
  allowed("https://pub-8156d70781324453bda28e90108800f1.r2.dev/cms/news/cover.png");
  allowed("https://SMAN68-JKT.MY.ID/assets/a.png");
});

test("menolak target SSRF: metadata cloud dan loopback", () => {
  blocked("http://169.254.169.254/latest/meta-data/iam/security-credentials/");
  blocked("https://169.254.169.254/latest/meta-data/");
  blocked("https://127.0.0.1:30000/api/health");
  blocked("https://localhost:30000/api/health");
  blocked("https://[::1]/api/health");
  blocked("https://metadata.google.internal/computeMetadata/v1/");
});

test("menolak jaringan privat", () => {
  blocked("https://10.0.0.5/internal.png");
  blocked("https://192.168.1.1/admin.png");
  blocked("https://172.16.9.9/secret.png");
  blocked("https://100.64.0.1/carrier.png");
});

test("menolak skema selain https dan URL rusak", () => {
  blocked("http://sman68-jkt.my.id/assets/a.png");
  blocked("file:///etc/passwd");
  blocked("gopher://sman68-jkt.my.id/");
  blocked("not-a-url");
  blocked("");
});

test("menolak host di luar allowlist meski https", () => {
  blocked("https://evil.example.com/payload.png");
  blocked("https://sman68-jkt.my.id.evil.com/payload.png");
  blocked("https://sub.sman68-jkt.my.id/payload.png");
});

test("menolak nama host internal lain", () => {
  blocked("https://db.internal/payload.png");
  blocked("https://service.local/payload.png");
});
