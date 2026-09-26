import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const logo = readFileSync(path.join(root, "public/assets/logo.png")).toString("base64");

function siteDomain() {
  let url = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  const envFile = path.join(root, ".env.local");
  if (!url && existsSync(envFile)) {
    const match = readFileSync(envFile, "utf8").match(/^NEXT_PUBLIC_APP_URL=(.*)$/m);
    if (match) url = match[1].trim().replace(/^["']|["']$/g, "");
  }
  if (!/^https:\/\//.test(url) || /localhost|127\.0\.0\.1/.test(url)) {
    url = "https://sman68-jkt.my.id";
  }
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

const domain = siteDomain();

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B2E20"/>
      <stop offset="1" stop-color="#16794A"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1060" cy="80" r="230" fill="#2FA36B" opacity="0.18"/>
  <circle cx="120" cy="610" r="190" fill="#B7EC6E" opacity="0.10"/>
  <rect x="0" y="0" width="12" height="630" fill="#B7EC6E"/>
  <image x="80" y="64" width="132" height="132" href="data:image/png;base64,${logo}" preserveAspectRatio="xMidYMid meet"/>
  <text x="80" y="330" font-family="DejaVu Sans, Arial, sans-serif" font-size="64" font-weight="bold" fill="#FFFFFF">SMA Negeri 68 Jakarta</text>
  <text x="80" y="392" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="#B7EC6E">Situs Resmi Sekolah</text>
  <line x1="80" y1="440" x2="420" y2="440" stroke="#B7EC6E" stroke-width="3" opacity="0.7"/>
  <text x="80" y="556" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" fill="#FFFFFF" opacity="0.85">${domain}</text>
</svg>`;

const out = path.join(root, "public/assets/og-default.png");
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
const meta = await sharp(out).metadata();
console.log(`OG image: ${out} (${meta.width}x${meta.height})`);
