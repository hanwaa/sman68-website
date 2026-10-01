import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { purgeContentCache } from "@/lib/content-cache";
import { dbConfigured, getDb } from "@/lib/db";
import { requireAccount, requireRole } from "@/lib/api-auth";
import { guardMutation, readJsonLimited, MemoryThrottle } from "@/lib/api-guard";

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

/** GET /api/achievements, siswa hanya melihat prestasinya sendiri */
export async function GET(request: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ data: [], source: "none" });
  }
  const requestedStudent = request.nextUrl.searchParams.get("student");
  const student = account.role === "student" ? account.name : requestedStudent;
  // Non-admin yang mengintip nama siswa lain hanya boleh melihat yang published
  // (pengajuan pending/draft/rejected milik orang lain disembunyikan).
  const viewingOther =
    account.role !== "admin" && student !== null && student !== account.name;
  const sql = getDb();

  const rows = (student
    ? viewingOther
      ? await sql`
        select id, title, description, level, category, award_type, year, cover_key, status, student_name
        from achievements
        where student_name = ${student} and status = 'published'
        order by year desc, created_at desc
      `
      : await sql`
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

/** POST /api/achievements, siswa mengajukan prestasi (status: pending) */
const achSubmitThrottle = new MemoryThrottle(2000, 20, 3_600_000);

export async function POST(request: NextRequest) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  const account = await requireRole(["student"]);
  if (account instanceof NextResponse) return account;

  // Kuota pengajuan: 20/jam per akun (anti-spam moderasi).
  const throttle = achSubmitThrottle.take(`ach:${account.id}`);
  if (!throttle.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak pengajuan. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfter) } }
    );
  }

  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const body = (await readJsonLimited<{
    title?: string;
    description?: string;
    participants?: unknown;
    level?: string;
    category?: string;
    year?: number;
  }>(request)) as {
    title?: string;
    description?: string;
    participants?: unknown;
    level?: string;
    category?: string;
    year?: number;
  } | null;

  const title = body?.title?.trim() ?? "";
  if (!title || title.length > 200) {
    return NextResponse.json(
      { error: "Judul prestasi wajib diisi (maks 200 karakter)." },
      { status: 400 }
    );
  }

  const participants = Array.isArray(body?.participants)
    ? body
        .participants!.map((name) => String(name).trim().slice(0, 80))
        .filter(Boolean)
        .slice(0, 20)
    : [];

  const yearRaw = Number(body?.year ?? new Date().getFullYear());
  const year = Number.isFinite(yearRaw)
    ? Math.min(2100, Math.max(2000, Math.trunc(yearRaw)))
    : new Date().getFullYear();
  const levelAllow = ["sekolah", "kota", "provinsi", "nasional", "internasional"];
  const level = levelAllow.includes(body?.level ?? "") ? body!.level! : "kota";
  const description = (body?.description ?? "").toString().slice(0, 5000);

  const id = `ach-${randomUUID()}`;
  const rows = (await getDb()`
    insert into achievements (
      id, title, description, level, category, award_type, year, cover_key,
      participants, status, student_name
    ) values (
      ${id}, ${title}, ${description || null}, ${level},
      ${(body?.category ?? "akademik").toString().slice(0, 60)}, ${"penghargaan"}, ${year},
      ${"/assets/hero-1.png"}, ${JSON.stringify(participants)}::jsonb, ${"pending"}, ${account.name}
    )
    returning id, title, description, level, category, award_type, year, cover_key, status, student_name
  `) as Row[];

  return NextResponse.json({ data: mapRow(rows[0]) });
}

/** PATCH /api/achievements { id, status }, admin menyetujui/menolak */
export async function PATCH(request: NextRequest) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  const account = await requireRole(["admin"]);
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const body = (await readJsonLimited<{ id?: string; status?: string }>(request)) as {
    id?: string;
    status?: string;
  } | null;

  const allowed = ["pending", "draft", "approved", "published", "rejected"];
  if (!body?.id || !body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: "id dan status valid wajib diisi." }, { status: 400 });
  }

  await getDb()`update achievements set status = ${body.status} where id = ${body.id}`;
  revalidatePath("/", "layout");
  updateTag("cms");
  purgeContentCache();
  return NextResponse.json({ ok: true });
}
