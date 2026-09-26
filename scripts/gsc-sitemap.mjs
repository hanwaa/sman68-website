// Submit / cek status sitemap lewat Search Console API.
//   node scripts/gsc-sitemap.mjs list
//   node scripts/gsc-sitemap.mjs submit [path-sitemap]
//
// Kredensial dibaca dari ~/.config/sman68-gsc.env (lihat scripts/gsc-auth.mjs).
// Token tidak pernah dicetak ke output.
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const CONFIG_FILE = path.join(homedir(), ".config", "sman68-gsc.env");
const SITE = process.env.GSC_SITE ?? "sc-domain:sman68-jkt.my.id";
const API = "https://www.googleapis.com/webmasters/v3";

function readConfig(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const config = readConfig(CONFIG_FILE);
const clientId = process.env.GSC_CLIENT_ID ?? config.GSC_CLIENT_ID;
const clientSecret = process.env.GSC_CLIENT_SECRET ?? config.GSC_CLIENT_SECRET;
const refreshToken = process.env.GSC_REFRESH_TOKEN ?? config.GSC_REFRESH_TOKEN;

if (!clientId || !clientSecret || !refreshToken) {
  console.error(`!! ${CONFIG_FILE} tidak lengkap. Jalankan dulu: node scripts/gsc-auth.mjs`);
  process.exit(1);
}

async function accessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`token gagal: ${data.error ?? res.status} — ${data.error_description ?? ""}`.trim());
  }
  return data.access_token;
}

const [, , action = "list", feedPath = "sitemap.xml"] = process.argv;
const token = await accessToken();
const auth = { authorization: `Bearer ${token}` };

if (action === "sites") {
  const res = await fetch(`${API}/sites`, { headers: auth });
  const data = await res.json();
  if (!res.ok) {
    console.error(`GAGAL ${res.status}:`, data.error?.message ?? JSON.stringify(data));
    process.exit(1);
  }
  for (const s of data.siteEntry ?? []) {
    console.log(`${s.siteUrl}  [${s.permissionLevel}]`);
  }
  process.exit(0);
}

if (action === "list") {
  const res = await fetch(`${API}/sites/${encodeURIComponent(SITE)}/sitemaps`, { headers: auth });
  const data = await res.json();
  if (!res.ok) {
    console.error(`GAGAL ${res.status}:`, data.error?.message ?? JSON.stringify(data));
    process.exit(1);
  }
  if (!data.sitemap?.length) {
    console.log("Belum ada sitemap terdaftar di properti ini.");
  }
  for (const s of data.sitemap) {
    const last = s.lastSubmitted ? new Date(Number(s.lastSubmitted)).toISOString() : "-";
    const errors = (s.errors ?? "").trim();
    const warnings = (s.warnings ?? "").trim();
    console.log(`${s.path}`);
    console.log(`  type      : ${s.type ?? "-"}`);
    console.log(`  submitted : ${last}`);
    console.log(`  status    : ${s.isPending ? "pending" : "done"}`);
    console.log(`  contents  : ${s.contents?.length ?? "?"} url(s)`);
    if (errors) console.log(`  errors    : ${errors}`);
    if (warnings) console.log(`  warnings  : ${warnings}`);
  }
  process.exit(0);
}

if (action === "submit") {
  const res = await fetch(`${API}/sites/${encodeURIComponent(SITE)}/sitemaps/${feedPath}`, {
    method: "PUT",
    headers: auth,
  });
  if (res.status === 204) {
    console.log(`OK: sitemap "${feedPath}" disubmit ke ${SITE} (HTTP 204).`);
    console.log("Google akan membacanya segera; status 'Pending' biasanya 1-2x24 jam.");
  } else {
    const data = await res.json().catch(() => ({}));
    console.error(`GAGAL ${res.status}:`, data.error?.message ?? JSON.stringify(data));
    process.exit(1);
  }
  process.exit(0);
}

console.error(`Aksi tidak dikenal: ${action}. Gunakan "list" atau "submit".`);
process.exit(1);
