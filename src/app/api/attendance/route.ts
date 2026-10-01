import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import { r2PublicUrl } from "@/lib/r2";
import { requireAccount } from "@/lib/api-auth";
import { guardMutation, readJsonLimited } from "@/lib/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type AttendanceApiRow = {
  studentId: string;
  name: string;
  date: string;
  status: "Masuk" | "Izin" | "Sakit" | "Alpa" | null;
  selfieKey: string | null;
  selfieUrl: string | null;
  checkInTime: string | null;
  recordedBy: string | null;
};

const STATUSES = ["Masuk", "Izin", "Sakit", "Alpa"] as const;
type Status = (typeof STATUSES)[number];

function toDateOnly(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value ?? "");
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString().slice(0, 10);
}

function mapRow(row: Record<string, unknown>): AttendanceApiRow {
  return {
    studentId: String(row.student_id),
    name: String(row.name ?? ""),
    date: toDateOnly(row.date),
    status: (row.status as Status | null) ?? null,
    selfieKey: (row.selfie_key as string | null) ?? null,
    selfieUrl: r2PublicUrl((row.selfie_key as string | null) ?? null),
    checkInTime: (row.check_in_time as string | null) ?? null,
    recordedBy: (row.recorded_by as string | null) ?? null,
  };
}

/** GET /api/attendance?studentId=...  atau  ?date=2026-09-22&class=X.1 */
export async function GET(request: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const sql = getDb();
  let studentId = request.nextUrl.searchParams.get("studentId");
  const date = request.nextUrl.searchParams.get("date");
  let className = request.nextUrl.searchParams.get("class");

  if (account.role === "student") {
    if (!account.studentId) return NextResponse.json({ records: [] });
    studentId = account.studentId;
    className = null;
  } else if (account.role === "teacher") {
    if (className && account.className && className !== account.className) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    className = className ?? account.className;
    if (!className) return NextResponse.json({ records: [] });
  }

  if (studentId) {
    // Scope: guru hanya boleh membaca siswa kelasnya sendiri; admin bebas.
    if (account.role === "teacher") {
      const target = (await sql`
        select class_name from students where id = ${studentId} limit 1
      `) as Record<string, unknown>[];
      if (!target[0] || String(target[0].class_name) !== account.className) {
        return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
      }
    }
    const rows = (await sql`
      select a.student_id, s.name, a.date::text as date, a.status, a.selfie_key, a.check_in_time, a.recorded_by
      from attendance a
      join students s on s.id = a.student_id
      where a.student_id = ${studentId}
      order by a.date desc
      limit 1000
    `) as Record<string, unknown>[];
    return NextResponse.json({ records: rows.map(mapRow) });
  }

  if (date) {
    // Tanpa filter kelas hanya boleh untuk admin. Guru tanpa wali kelas
    // tidak boleh membaca seluruh sekolah lewat jalur ini.
    if (!className && account.role !== "admin") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    const rows = (className
      ? await sql`
          select s.id as student_id, s.name, (${date}::date)::text as date, a.status,
                 a.selfie_key, a.check_in_time, a.recorded_by
          from students s
          left join attendance a on a.student_id = s.id and a.date = ${date}::date
          where s.class_name = ${className}
          order by s.name
        `
      : await sql`
          select s.id as student_id, s.name, (${date}::date)::text as date, a.status,
                 a.selfie_key, a.check_in_time, a.recorded_by
          from students s
          left join attendance a on a.student_id = s.id and a.date = ${date}::date
          where s.nisn is not null
          order by s.class_name, s.name
          limit 400
        `) as Record<string, unknown>[];
    return NextResponse.json({ records: rows.map(mapRow) });
  }

  // Fallback tanpa filter hanya untuk admin. Guru/siswa wajib memakai
  // ?studentId=... atau ?date=...&class=... agar tidak membocorkan data
  // seluruh sekolah (IDOR).
  if (account.role !== "admin") {
    return NextResponse.json(
      { error: "Parameter studentId atau date wajib diisi." },
      { status: 400 }
    );
  }
  const rows = (await sql`
    select a.student_id, s.name, a.date::text as date, a.status, a.selfie_key, a.check_in_time, a.recorded_by
    from attendance a
    join students s on s.id = a.student_id
    order by a.date desc
    limit 500
  `) as Record<string, unknown>[];
  return NextResponse.json({ records: rows.map(mapRow) });
}

/** POST /api/attendance, upsert absensi (siswa: selfie, wali kelas: status) */
export async function POST(request: NextRequest) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  const body = (await readJsonLimited<{
    studentId?: string;
    date?: string;
    status?: Status;
    selfieKey?: string;
    checkInTime?: string;
  }>(request)) as {
    studentId?: string;
    date?: string;
    status?: Status;
    selfieKey?: string;
    checkInTime?: string;
  } | null;

  const studentId = String(body?.studentId ?? "").trim();
  const date = String(body?.date ?? "").trim();
  if (!studentId || !date) {
    return NextResponse.json({ error: "studentId dan date wajib diisi." }, { status: 400 });
  }

  const sql = getDb();

  if (account.role === "student") {
    if (!account.studentId || studentId !== account.studentId) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  } else if (account.role === "teacher") {
    const target = (await sql`
      select class_name from students where id = ${studentId} limit 1
    `) as Record<string, unknown>[];
    if (!target[0] || String(target[0].class_name) !== account.className) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
  }

  const status = body?.status && STATUSES.includes(body.status) ? body.status : null;
  const recordedBy = account.role === "student" ? null : account.name;

  // selfieKey wajib key R2 (karakter path aman), menolak URL absolut
  // (https://evil/...) yang akan dirender sebagai link foto di dashboard.
  const selfieKey = body?.selfieKey ?? null;
  if (selfieKey !== null && !/^[A-Za-z0-9/_.-]{1,220}$/.test(String(selfieKey))) {
    return NextResponse.json({ error: "selfieKey tidak valid." }, { status: 400 });
  }

  const rows = (await sql`
    insert into attendance (student_id, date, status, selfie_key, check_in_time, recorded_by)
    values (${studentId}, ${date}::date, ${status}, ${selfieKey},
            ${body?.checkInTime ?? null}, ${recordedBy})
    on conflict (student_id, date) do update set
      status = coalesce(excluded.status, attendance.status),
      selfie_key = coalesce(excluded.selfie_key, attendance.selfie_key),
      check_in_time = coalesce(excluded.check_in_time, attendance.check_in_time),
      recorded_by = coalesce(excluded.recorded_by, attendance.recorded_by),
      updated_at = now()
    returning student_id, date::text as date, status, selfie_key, check_in_time, recorded_by
  `) as Record<string, unknown>[];

  const row = rows[0] as Record<string, unknown>;
  return NextResponse.json({
    record: {
      studentId: String(row.student_id),
      date: toDateOnly(row.date),
      status: (row.status as Status | null) ?? null,
      selfieKey: (row.selfie_key as string | null) ?? null,
      selfieUrl: r2PublicUrl((row.selfie_key as string | null) ?? null),
      checkInTime: (row.check_in_time as string | null) ?? null,
      recordedBy: (row.recorded_by as string | null) ?? null,
    },
  });
}
