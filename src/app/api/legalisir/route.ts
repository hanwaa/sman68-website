import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { dbConfigured, getDb } from "@/lib/db";
import { requireAccount, requireRole } from "@/lib/api-auth";
import { guardMutation, readJsonLimited } from "@/lib/api-guard";
import { isGrade12 } from "@/lib/legalisir";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const text = (v: unknown) => (v == null ? "" : String(v));

async function ensureTables() {
  const sql = getDb();
  await sql`
    create table if not exists service_settings (
      key text primary key,
      value jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    create table if not exists legalisir_requests (
      id uuid primary key default gen_random_uuid(),
      student_id text,
      student_name text not null,
      class_name text,
      sheets integer not null default 1,
      purpose text,
      status text not null default 'pending'
        check (status in ('pending', 'approved', 'rejected', 'done')),
      note text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`
    insert into service_settings (key, value)
    values ('legalisir_open', '{"open": true}'::jsonb)
    on conflict (key) do nothing
  `;
}

async function getOpen(): Promise<boolean> {
  const sql = getDb();
  const rows = (await sql`
    select value from service_settings where key = 'legalisir_open'
  `) as Row[];
  const val = rows[0]?.value as { open?: boolean } | string | null;
  if (val == null) return true;
  if (typeof val === "string") {
    try {
      return (JSON.parse(val) as { open?: boolean }).open !== false;
    } catch {
      return true;
    }
  }
  return val.open !== false;
}

function mapRow(row: Row) {
  return {
    id: text(row.id),
    studentName: text(row.student_name),
    className: (row.class_name as string | null) ?? null,
    sheets: Number(row.sheets ?? 1),
    purpose: text(row.purpose),
    status: text(row.status),
    note: (row.note as string | null) ?? null,
    createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : new Date().toISOString(),
  };
}

/**
 * GET /api/legalisir
 * - siswa: { open, isGrade12, mine[] }
 * - admin: { open, requests[] }
 */
export async function GET() {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;
  if (!dbConfigured()) {
    return NextResponse.json({ open: true, mine: [], requests: [], source: "none" });
  }
  try {
    await ensureTables();
    const open = await getOpen();
    const sql = getDb();
    if (account.role === "admin") {
      const rows = (await sql`
        select id, student_name, class_name, sheets, purpose, status, note, created_at
        from legalisir_requests
        order by created_at desc
        limit 200
      `) as Row[];
      return NextResponse.json({ open, requests: rows.map(mapRow), source: "db" });
    }
    const mine =
      account.role === "student"
        ? ((await sql`
            select id, student_name, class_name, sheets, purpose, status, note, created_at
            from legalisir_requests
            where student_name = ${account.name}
            order by created_at desc
            limit 50
          `) as Row[])
        : [];
    return NextResponse.json({
      open,
      isGrade12: isGrade12(account.className),
      mine: mine.map(mapRow),
      source: "db",
    });
  } catch {
    return NextResponse.json({ error: "Gagal memuat data legalisir." }, { status: 500 });
  }
}

/** POST /api/legalisir, siswa kelas 12 mengajukan legalisir (hanya saat dibuka admin) */
export async function POST(request: NextRequest) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  const account = await requireRole(["student"]);
  if (account instanceof NextResponse) return account;
  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const body = (await readJsonLimited<{ sheets?: number; purpose?: string }>(request)) as {
    sheets?: number;
    purpose?: string;
  } | null;

  const sheets = Math.min(20, Math.max(1, Math.trunc(Number(body?.sheets ?? 1) || 1)));
  const purpose = (body?.purpose ?? "").toString().slice(0, 500).trim();
  if (!purpose) {
    return NextResponse.json({ error: "Keperluan legalisir wajib diisi." }, { status: 400 });
  }

  try {
    await ensureTables();
    if (!isGrade12(account.className)) {
      return NextResponse.json(
        { error: "Layanan legalisir ijazah hanya untuk siswa kelas 12." },
        { status: 403 }
      );
    }
    const open = await getOpen();
    if (!open) {
      return NextResponse.json(
        { error: "Layanan legalisir sedang ditutup. Hubungi Tata Usaha." },
        { status: 403 }
      );
    }
    const id = randomUUID();
    const rows = (await getDb()`
      insert into legalisir_requests (id, student_id, student_name, class_name, sheets, purpose, status)
      values (${id}, ${account.studentId}, ${account.name}, ${account.className}, ${sheets}, ${purpose}, 'pending')
      returning id, student_name, class_name, sheets, purpose, status, note, created_at
    `) as Row[];
    return NextResponse.json({ data: mapRow(rows[0]) });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan pengajuan." }, { status: 500 });
  }
}

/**
 * PATCH /api/legalisir
 * - admin: { action: "toggle", open } atau { action: "status", id, status, note }
 */
export async function PATCH(request: NextRequest) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  const account = await requireRole(["admin"]);
  if (account instanceof NextResponse) return account;
  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const body = (await readJsonLimited<{
    action?: string;
    open?: boolean;
    id?: string;
    status?: string;
    note?: string;
  }>(request)) as {
    action?: string;
    open?: boolean;
    id?: string;
    status?: string;
    note?: string;
  } | null;

  try {
    await ensureTables();
    const sql = getDb();
    if (body?.action === "toggle") {
      const open = body.open !== false;
      await sql`
        insert into service_settings (key, value, updated_at)
        values ('legalisir_open', ${JSON.stringify({ open })}::jsonb, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()
      `;
      return NextResponse.json({ open });
    }
    const allowed = ["pending", "approved", "rejected", "done"];
    if (!body?.id || !body.status || !allowed.includes(body.status)) {
      return NextResponse.json({ error: "id dan status valid wajib diisi." }, { status: 400 });
    }
    const note = (body.note ?? "").toString().slice(0, 500) || null;
    await sql`
      update legalisir_requests
      set status = ${body.status}, note = ${note}, updated_at = now()
      where id = ${body.id}::uuid
    `;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui legalisir." }, { status: 500 });
  }
}
