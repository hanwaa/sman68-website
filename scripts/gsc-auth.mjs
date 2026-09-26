// Otorisasi satu kali untuk Search Console API.
// Menjalankan server loopback, menunggu kamu login di browser, lalu menyimpan
// refresh token ke ~/.config/sman68-gsc.env (chmod 600, di luar repo).
//
// Prasyarat: ~/.config/sman68-gsc.env sudah berisi GSC_CLIENT_ID & GSC_CLIENT_SECRET
// Contoh isi file itu (JANGAN ditempel di chat):
//   GSC_CLIENT_ID=xxxxx.apps.googleusercontent.com
//   GSC_CLIENT_SECRET=GOCSPX-xxxxx
import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(homedir(), ".config");
const CONFIG_FILE = path.join(CONFIG_DIR, "sman68-gsc.env");
const PORT = Number(process.env.GSC_AUTH_PORT ?? 8976);
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = "https://www.googleapis.com/auth/webmasters";

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

if (!clientId || !clientSecret) {
  console.error(`!! ${CONFIG_FILE} belum ada atau kosong.`);
  console.error("   Isi dulu GSC_CLIENT_ID dan GSC_CLIENT_SECRET, lalu jalankan ulang.");
  process.exit(1);
}

const params = new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT_URI,
  response_type: "code",
  scope: SCOPE,
  access_type: "offline",
  prompt: "consent",
});
const consentUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/oauth2callback") {
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error || !code) {
      res.writeHead(400, { "content-type": "text/html; charset=utf-8" });
      res.end(`<h1>Gagal</h1><p>${error ?? "tidak ada kode"}</p>`);
      server.close();
      process.exitCode = 1;
      return;
    }

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json();

      if (!tokenRes.ok || !tokens.refresh_token) {
        throw new Error(tokens.error_description ?? JSON.stringify(tokens));
      }

      mkdirSync(CONFIG_DIR, { recursive: true });
      const existing = existsSync(CONFIG_FILE) ? readConfig(CONFIG_FILE) : {};
      const merged = { ...existing, GSC_REFRESH_TOKEN: tokens.refresh_token };
      const body = [
        "# Search Console API — dibuat otomatis oleh scripts/gsc-auth.mjs",
        "# Jangan commit file ini.",
        `GSC_CLIENT_ID=${merged.GSC_CLIENT_ID ?? clientId}`,
        `GSC_CLIENT_SECRET=${merged.GSC_CLIENT_SECRET ?? clientSecret}`,
        `GSC_REFRESH_TOKEN=${tokens.refresh_token}`,
        "",
      ].join("\n");
      writeFileSync(CONFIG_FILE, body, { mode: 0o600 });
      chmodSync(CONFIG_FILE, 0o600);

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(
        "<h1>Berhasil</h1><p>Refresh token tersimpan di ~/.config/sman68-gsc.env</p><p>Jendela ini bisa ditutup.</p>",
      );
      console.log(`OK: refresh token tersimpan (${CONFIG_FILE}, mode 600)`);
      if (tokens.expires_in) console.log(`access token berlaku ${tokens.expires_in}s; refresh token dipakai untuk request berikutnya.`);
    } catch (err) {
      res.writeHead(500, { "content-type": "text/html; charset=utf-8" });
      res.end(`<h1>Gagal menukar kode</h1><pre>${String(err)}</pre>`);
      console.error("GAGAL:", err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("404");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("Server otorisasi aktif. Buka URL ini di browser:");
  console.log(`\n${consentUrl}\n`);
  console.log(`Menunggu callback di ${REDIRECT_URI} ...`);
  console.log("Ctrl+C untuk batal.");
});
