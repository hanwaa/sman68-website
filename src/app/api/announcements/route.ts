import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import { requireAccount, requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

const relativeLabel = (iso: string | null) => {
  if (!iso) return "";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
};

/** GET /api/announcements?audience=student|teacher */
export async function GET(request: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ data: [], source: "none" });
  }
  const audience = request.nextUrl.searchParams.get("audience");
  const sql = getDb();

  const rows = (audience
    ? await sql`
        select id, title, body, audience, urgent, pinned, author, published_at
        from announcements
        where status = 'published' and audience in ('all', ${audience})
        order by pinned desc, published_at desc
      `
    : await sql`
        select id, title, body, audience, urgent, pinned, author, published_at
        from announcements
        where status = 'published'
        order by published_at desc
      `) as Row[];

  return NextResponse.json({
    data: rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      body: (row.body as string | null) ?? "",
      audience: String(row.audience),
      urgent: Boolean(row.urgent),
      pinned: Boolean(row.pinned),
      author: (row.author as string | null) ?? "",
      time: relativeLabel(row.published_at as string | null),
      read: false,
    })),
    source: "db",
  });
}

/** POST /api/announcements — guru/admin menerbitkan pengumuman */
export async function POST(request: NextRequest) {
  const account = await requireRole(["teacher", "admin"]);
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as
    | { title?: string; body?: string; audience?: string; urgent?: boolean }
    | null;

  if (!body?.title?.trim()) {
    return NextResponse.json({ error: "Judul pengumuman wajib diisi." }, { status: 400 });
  }

  const rows = await getDb()`
    insert into announcements (title, body, audience, urgent, pinned, author, status)
    values (${body.title.trim()}, ${body.body ?? null}, ${body.audience ?? "student"},
            ${Boolean(body.urgent)}, ${false}, ${account.name}, ${"published"})
    returning id, title, body, audience, urgent, pinned, author, published_at
  `;

  const row = (rows as Row[])[0];
  return NextResponse.json({
    data: {
      id: String(row.id),
      title: String(row.title),
      body: (row.body as string | null) ?? "",
      audience: String(row.audience),
      urgent: Boolean(row.urgent),
      pinned: Boolean(row.pinned),
      author: (row.author as string | null) ?? "",
      time: "Baru saja",
      read: false,
    },
  });
}
