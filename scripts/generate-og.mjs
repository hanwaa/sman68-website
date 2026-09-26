import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const logo = readFileSync(path.join(root, "public/assets/og-logo.png")).toString("base64");

// Foto gedung jadi latar kartu OG: Google memakai og:image sebagai thumbnail di
// hasil pencarian, jadi isinya harus terlihat sebagai sekolah, bukan logo saja.
const HERO = process.env.OG_HERO ?? "public/assets/sekolah/sekolah-01-gedung.jpg";

const hero = await sharp(path.join(root, HERO))
  .resize(1200, 630, { fit: "cover", position: "attention" })
  .modulate({ brightness: 0.8, saturation: 1.05 })
  .jpeg({ quality: 82 })
  .toBuffer();
const heroData = `data:image/jpeg;base64,${hero.toString("base64")}`;

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
    <linearGradient id="veil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#062A31" stop-opacity="0.88"/>
      <stop offset="0.55" stop-color="#062A31" stop-opacity="0.62"/>
      <stop offset="1" stop-color="#0A5A66" stop-opacity="0.3"/>
    </linearGradient>
  </defs>
  <image x="0" y="0" width="1200" height="630" href="${heroData}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1200" height="630" fill="url(#veil)"/>
  <circle cx="1080" cy="70" r="220" fill="#0B7688" opacity="0.16"/>
  <circle cx="110" cy="620" r="180" fill="#FFFF00" opacity="0.08"/>
  <rect x="0" y="0" width="12" height="630" fill="#FFFF00"/>
  <image x="72" y="58" width="104" height="104" href="data:image/png;base64,${logo}" preserveAspectRatio="xMidYMid meet"/>
  <text x="80" y="336" font-family="DejaVu Sans, Arial, sans-serif" font-size="64" font-weight="bold" fill="#FFFFFF">SMA Negeri 68 Jakarta</text>
  <text x="80" y="398" font-family="DejaVu Sans, Arial, sans-serif" font-size="30" fill="#FFFF00">Situs Resmi Sekolah</text>
  <line x1="80" y1="446" x2="420" y2="446" stroke="#FFFF00" stroke-width="3" opacity="0.7"/>
  <text x="80" y="562" font-family="DejaVu Sans, Arial, sans-serif" font-size="26" fill="#FFFFFF" opacity="0.85">${domain}</text>
</svg>`;

const out = path.join(root, "public/assets/og-school.png");
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
const meta = await sharp(out).metadata();
console.log(`OG image: ${out} (${meta.width}x${meta.height})`);
