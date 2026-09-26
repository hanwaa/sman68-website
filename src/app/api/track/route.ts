import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";

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

/** Hanya lintasan halaman publik yang dicatat — bukan dashboard/login/API. */
function sanitizePath(raw: string): string | null {
  const path = raw.split("?")[0].split("#")[0].trim();
  if (!path.startsWith("/") || path.length > PATH_MAX_LENGTH) return null;
  if (path === "/") return "/";
  return PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
    ? path
    : null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { path?: string } | null;
  const path = sanitizePath(body?.path ?? "");

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const sameOrigin = !origin || !host || new URL(origin).host === host;
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

  // Hitungan pembaca artikel: /berita/<slug>
  const articleMatch = path.match(/^\/berita\/([^/]+)$/);
  const slug = articleMatch ? decodeURIComponent(articleMatch[1]).slice(0, 160) : null;

  try {
    const sql = getDb();
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
    ]);
    if (slug) {
      await sql`
        update news set views = views + 1
        where slug = ${slug} and status = 'published'
      `;
    }
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
