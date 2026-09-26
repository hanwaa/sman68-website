import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dbConfigured, getDb } from "@/lib/db";
import { requireAccount, requireRole } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const text = (v: unknown) => (v == null ? "" : String(v));

function mapRow(row: Row) {
  return {
    id: text(row.id),
    title: text(row.title),
    description: text(row.description),
    level: text(row.level),
    category: text(row.category),
    awardType: text(row.award_type),
    year: Number(row.year),
    cover: text(row.cover_key),
    status: text(row.status),
    studentName: (row.student_name as string | null) ?? null,
  };
}

/** GET /api/achievements — siswa hanya melihat prestasinya sendiri */
export async function GET(request: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ data: [], source: "none" });
  }
  const requestedStudent = request.nextUrl.searchParams.get("student");
  const student = account.role === "student" ? account.name : requestedStudent;
  const sql = getDb();

  const rows = (student
    ? await sql`
        select id, title, description, level, category, award_type, year, cover_key, status, student_name
        from achievements
        where student_name = ${student}
        order by year desc, created_at desc
      `
    : await sql`
        select id, title, description, level, category, award_type, year, cover_key, status, student_name
        from achievements
        where status = 'published'
        order by year desc, title asc
      `) as Row[];

  return NextResponse.json({ data: rows.map(mapRow), source: "db" });
}

/** POST /api/achievements — siswa mengajukan prestasi (status: pending) */
export async function POST(request: NextRequest) {
  const account = await requireRole(["student"]);
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as
    | {
        title?: string;
        description?: string;
        participants?: unknown;
        level?: string;
        category?: string;
        year?: number;
      }
    | null;

  if (!body?.title?.trim()) {
    return NextResponse.json({ error: "Judul prestasi wajib diisi." }, { status: 400 });
  }

  const participants = Array.isArray(body.participants)
    ? body.participants.map((name) => String(name).trim()).filter(Boolean)
    : [];

  const id = `ach-${Date.now().toString(36)}`;
  const rows = (await getDb()`
    insert into achievements (
      id, title, description, level, category, award_type, year, cover_key,
      participants, status, student_name
    ) values (
      ${id}, ${body.title.trim()}, ${body.description ?? null}, ${body.level ?? "kota"},
      ${body.category ?? "akademik"}, ${"penghargaan"}, ${body.year ?? new Date().getFullYear()},
      ${"/assets/hero-1.png"}, ${JSON.stringify(participants)}::jsonb, ${"pending"}, ${account.name}
    )
    returning id, title, description, level, category, award_type, year, cover_key, status, student_name
  `) as Row[];

  return NextResponse.json({ data: mapRow(rows[0]) });
}

/** PATCH /api/achievements { id, status } — admin menyetujui/menolak */
export async function PATCH(request: NextRequest) {
  const account = await requireRole(["admin"]);
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as
    | { id?: string; status?: string }
    | null;

  const allowed = ["pending", "draft", "approved", "published", "rejected"];
  if (!body?.id || !body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: "id dan status valid wajib diisi." }, { status: 400 });
  }

  await getDb()`update achievements set status = ${body.status} where id = ${body.id}`;
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
