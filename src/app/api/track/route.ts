import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import { trackSampleRate } from "@/lib/track-sample";
import { readJsonLimited } from "@/lib/api-guard";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "sman68_vid";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|monitor|facebookexternalhit|whatsapp/i;
const PATH_MAX_LENGTH = 160;

const PUBLIC_PREFIXES = [
  "/berita",
  "/prestasi",
  "/kehidupan",
  "/tentang",
  "/komunitas",
  "/akademik",
  "/ppdb",
  "/kebijakan-privasi",
  "/aksesibilitas",
];

/** Hanya lintasan halaman publik yang dicatat, bukan dashboard/login/API. */
function sanitizePath(raw: string): string | null {
  const path = raw.split("?")[0].split("#")[0].trim();
  if (!path.startsWith("/") || path.length > PATH_MAX_LENGTH) return null;
  if (path === "/") return "/";
  return PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
    ? path
    : null;
}

export async function POST(request: NextRequest) {
  const body = (await readJsonLimited<{ path?: string }>(request, 2000)) as {
    path?: string;
  } | null;
  const path = sanitizePath(body?.path ?? "");

  const sameOrigin = isSameOrigin(request);
  const userAgent = request.headers.get("user-agent") ?? "";

  if (!path || !sameOrigin || BOT_PATTERN.test(userAgent) || !dbConfigured()) {
    return new NextResponse(null, { status: 204 });
  }

  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value ?? "";
  let issueCookie = false;
  if (!/^[a-f0-9]{32}$/.test(visitorId)) {
    visitorId = crypto.randomUUID().replace(/-/g, "");
    issueCookie = true;
  }

  // Sampling tulis: tiap pageview = 3 tulis ke baris panas yang sama
  // (upsert page_views + insert site_visits + update news.views). Saat banjir
  // traffic, ratusan upsert konkuren ke SATU baris = lock contention +
  // pool habis. Sampling deterministik per pengunjung (hash stabil, tak bias):
  // beban tulis turun proporsional, estimasi = hitungan × (1/rate).
  // Atur penuh via env saat butuh akurasi mutlak: TRACK_SAMPLE_RATE=1
  const TRACK_SAMPLE_RATE = trackSampleRate();
  let visitorHash = 0;
  for (let i = 0; i < visitorId.length; i++) {
    visitorHash = (visitorHash * 31 + visitorId.charCodeAt(i)) >>> 0;
  }
  const sampledIn = TRACK_SAMPLE_RATE >= 1 || visitorHash % 100 < TRACK_SAMPLE_RATE * 100;

  // Hitungan pembaca artikel: /berita/<slug>
  const articleMatch = path.match(/^\/berita\/([^/]+)$/);
  const slug = articleMatch ? decodeURIComponent(articleMatch[1]).slice(0, 160) : null;

  if (!sampledIn) {
    const response = new NextResponse(null, { status: 204 });
    if (issueCookie) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: VISITOR_MAX_AGE,
      });
    }
    return response;
  }

  try {
    const sql = getDb();
    // Ketiga tulis digabung paralel (termasuk update views artikel) agar
    // 1 pageview = 1 round-trip, bukan 2.
    await Promise.all([
      sql`
        insert into page_views (day, path, views)
        values (current_date, ${path}, 1)
        on conflict (day, path) do update set
          views = page_views.views + 1,
          updated_at = now()
      `,
      sql`
        insert into site_visits (day, visitor_id)
        values (current_date, ${visitorId})
        on conflict (day, visitor_id) do nothing
      `,
      slug
        ? sql`
          update news set views = views + 1
          where slug = ${slug} and status = 'published'
        `
        : Promise.resolve([]),
    ]);
  } catch {
    /* pencatatan statistik tidak boleh mengganggu pengunjung */
  }

  const response = new NextResponse(null, { status: 204 });
  if (issueCookie) {
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: VISITOR_MAX_AGE,
    });
  }
  return response;
}
