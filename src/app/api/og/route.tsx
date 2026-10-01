import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { absoluteUrl } from "@/lib/seo";
import { checkRemoteImage } from "@/lib/remote-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WIDTH = 1200;
const HEIGHT = 630;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 5000;

const BRAND = {
  pine: "#062A31",
  green: "#0A5A66",
  leaf: "#0B7688",
  lime: "#FFFF00",
  cream: "#F4FAFB",
};

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function mimeFromPath(url: string): string {
  const clean = url.split(/[?#]/)[0].toLowerCase();
  const ext = clean.slice(clean.lastIndexOf("."));
  return MIME_BY_EXT[ext] ?? "image/png";
}

function toDataUri(bytes: Buffer, mime: string): string {
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

/**
 * Host yang boleh dijadikan sumber gambar jarak jauh: domain sendiri dan host
 * R2 publik. Nilai lain ditolak supaya /api/og tidak bisa dipakai mengambil
 * URL internal (SSRF) lalu membocorkannya lewat gambar hasil render.
 */
function allowedImageHosts(): string[] {
  const hosts = new Set<string>();
  for (const candidate of [
    absoluteUrl("/"),
    process.env.R2_PUBLIC_BASE_URL ?? "",
  ]) {
    try {
      const host = new URL(candidate).hostname;
      if (host) hosts.add(host);
    } catch {
      // konfigurasi tidak valid, diabaikan.
    }
  }
  return Array.from(hosts);
}

let logoPromise: Promise<string | null> | undefined;

function loadLogo(): Promise<string | null> {
  logoPromise ??= readFile(path.join(process.cwd(), "public/assets/og-logo.png"))
    .then((buf) => toDataUri(buf, "image/png"))
    .catch(() => null);
  return logoPromise;
}

async function loadCover(src: string | null): Promise<string | null> {
  if (!src) return null;
  try {
    // Aset lokal dibaca dari disk: dari VPS, domain publik sendiri tidak bisa
    // dijangkau (hairpin NAT), jadi fetch via HTTP akan timeout.
    if (src.startsWith("/") && !src.includes("..")) {
      const buf = await readFile(path.join(process.cwd(), "public", src.replace(/^\/+/, "")));
      if (buf.byteLength > MAX_IMAGE_BYTES) return null;
      return toDataUri(buf, mimeFromPath(src));
    }

    const decision = checkRemoteImage(src, allowedImageHosts());
    if (!decision.ok) return null;

    // redirect manual + validasi ulang tiap hop: cegah allowlist lolos lalu
    // 302 ke IP privat/metadata (169.254.169.254).
    let url = decision.url;
    let res: Response | null = null;
    for (let hop = 0; hop < 3; hop += 1) {
      const step = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { accept: "image/*" },
        redirect: "manual",
      });
      const location = step.headers.get("location");
      if (step.status >= 300 && step.status < 400 && location) {
        const next = new URL(location, url).toString();
        const recheck = checkRemoteImage(next, allowedImageHosts());
        if (!recheck.ok) return null;
        url = recheck.url;
        continue;
      }
      res = step;
      break;
    }
    if (!res || !res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_IMAGE_BYTES) return null;
    return toDataUri(buf, type.split(";")[0]);
  } catch {
    return null;
  }
}

const TITLE_STEPS = [
  { max: 34, size: 78 },
  { max: 62, size: 66 },
  { max: 92, size: 58 },
  { max: 120, size: 52 },
];

/** Satori tidak menopong lineClamp, jadi judul dipotong manual per ukuran. */
function fitTitle(title: string): { text: string; size: number } {
  const step = TITLE_STEPS.find((item) => title.length <= item.max) ?? {
    max: TITLE_STEPS[TITLE_STEPS.length - 1].max,
    size: TITLE_STEPS[TITLE_STEPS.length - 1].size,
  };
  const text =
    title.length > step.max ? `${title.slice(0, step.max - 1).trimEnd()}…` : title;
  return { text, size: step.size };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "").trim().slice(0, 160);
  const category = (searchParams.get("category") ?? "").trim().slice(0, 40);
  const label = (searchParams.get("label") ?? "SMAN 68 Jakarta").trim().slice(0, 60);
  const site = absoluteUrl("/").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const cover = await loadCover(searchParams.get("image"));
  const logo = await loadLogo();

  const headline = fitTitle(title || "Situs Resmi SMA Negeri 68 Jakarta");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: BRAND.pine,
          backgroundImage: `linear-gradient(135deg, ${BRAND.pine} 0%, ${BRAND.green} 100%)`,
          padding: "64px 72px",
          position: "relative",
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={WIDTH}
            height={HEIGHT}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.22,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -120,
            width: 460,
            height: 460,
            borderRadius: 999,
            backgroundColor: BRAND.leaf,
            opacity: 0.18,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -100,
            width: 420,
            height: 420,
            borderRadius: 999,
            backgroundColor: BRAND.lime,
            opacity: 0.1,
            display: "flex",
          }}
        />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 14, backgroundColor: BRAND.lime, display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" width={104} height={104} style={{ width: 104, height: 104, objectFit: "contain" }} />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, color: "rgba(246,248,245,0.62)" }}>SMA Negeri</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: BRAND.cream, lineHeight: 1.1 }}>68 Jakarta</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1010, marginTop: 24 }}>
          {category ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                fontSize: 26,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: BRAND.pine,
                backgroundColor: BRAND.lime,
                borderRadius: 999,
                padding: "10px 24px",
                marginBottom: 28,
              }}
            >
              {category}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: headline.size,
              fontWeight: 700,
              lineHeight: 1.12,
              color: "#FFFFFF",
            }}
          >
            {headline.text}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28 }}>
          <div style={{ display: "flex", color: "rgba(255,255,255,0.85)" }}>{site}</div>
          <div style={{ display: "flex", color: BRAND.lime }}>{label}</div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
      },
    }
  );
}
