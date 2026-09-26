import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import { requireAccount } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export type NotifKind =
  | "pengumuman"
  | "tugas"
  | "nilai"
  | "permintaan"
  | "moderasi"
  | "akun";

type NotificationItem = {
  id: string;
  kind: NotifKind;
  title: string;
  detail: string;
  time: string;
  ts: number;
};

const text = (value: unknown) => (value == null ? "" : String(value));

function relativeLabel(iso: string | null | undefined): string {
  if (!iso) return "Baru saja";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

const toTs = (iso: unknown): number => {
  if (!iso) return 0;
  const time = new Date(String(iso)).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const snippet = (value: unknown, max = 90) => {
  const clean = text(value).replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
};

async function buildNotifications(account: {
  role: string;
  name: string;
  studentId: string | null;
}): Promise<NotificationItem[]> {
  const sql = getDb();
  const items: NotificationItem[] = [];

  if (account.role === "student") {
    const [annRows, dueRows, gradeRows] = await Promise.all([
      sql`
        select id, title, body, published_at
        from announcements
        where status = 'published' and audience in ('all', 'student')
        order by published_at desc
        limit 8
      ` as Promise<Row[]>,
      account.studentId
        ? (sql`
            select a.id, a.title, a.due_label, a.due_at
            from class_assignments a
            join class_members cm
              on cm.class_id = a.class_id and cm.student_id = ${account.studentId} and cm.enrolled = true
            left join class_submissions cs
              on cs.assignment_id = a.id and cs.student_id = ${account.studentId}
            where (cs.status is null or cs.status = 'assigned')
              and a.due_at is not null
              and a.due_at between now() - interval '1 day' and now() + interval '3 days'
            order by a.due_at asc
            limit 6
          ` as Promise<Row[]>)
        : Promise.resolve([] as Row[]),
      account.studentId
        ? (sql`
            select cs.id, a.title, cs.grade, cs.updated_at
            from class_submissions cs
            join class_assignments a on a.id = cs.assignment_id
            where cs.student_id = ${account.studentId} and cs.status = 'graded'
            order by cs.updated_at desc
            limit 5
          ` as Promise<Row[]>)
        : Promise.resolve([] as Row[]),
    ]);

    for (const row of annRows) {
      items.push({
        id: `ann-${text(row.id)}`,
        kind: "pengumuman",
        title: `Pengumuman: ${text(row.title)}`,
        detail: snippet(row.body),
        time: relativeLabel(row.published_at as string),
        ts: toTs(row.published_at),
      });
    }
    for (const row of dueRows) {
      items.push({
        id: `due-${text(row.id)}`,
        kind: "tugas",
        title: `Tenggat dekat: ${text(row.title)}`,
        detail: `Batas: ${text(row.due_label) || "segera"}`,
        time: relativeLabel(row.due_at as string),
        ts: toTs(row.due_at),
      });
    }
    for (const row of gradeRows) {
      items.push({
        id: `grade-${text(row.id)}`,
        kind: "nilai",
        title: `Nilai keluar: ${text(row.title)}`,
        detail: `Skor ${Number(row.grade) || 0}`,
        time: relativeLabel(row.updated_at as string),
        ts: toTs(row.updated_at),
      });
    }
  }

  if (account.role === "teacher") {
    const [joinRows, gradeRows, annRows] = await Promise.all([
      sql`
        select c.id, c.name, c.section, count(*)::int as total, max(cm.requested_at) as requested_at
        from class_members cm
        join classes c on c.id = cm.class_id
        where cm.enrolled = false and c.teacher_name = ${account.name}
        group by c.id, c.name, c.section
        order by requested_at desc
        limit 6
      ` as Promise<Row[]>,
      sql`
        select count(*)::int as total, max(cs.updated_at) as updated_at
        from class_submissions cs
        join class_assignments a on a.id = cs.assignment_id
        join classes c on c.id = a.class_id
        where cs.status = 'turned_in' and c.teacher_name = ${account.name}
      ` as Promise<Row[]>,
      sql`
        select id, title, body, published_at
        from announcements
        where status = 'published' and audience in ('all', 'teacher')
        order by published_at desc
        limit 5
      ` as Promise<Row[]>,
    ]);

    for (const row of joinRows) {
      const ts = toTs(row.requested_at);
      items.push({
        id: `join-${text(row.id)}-${ts}`,
        kind: "permintaan",
        title: `${Number(row.total) || 0} permintaan bergabung`,
        detail: `${text(row.name)} ${text(row.section)}`,
        time: relativeLabel(row.requested_at as string),
        ts,
      });
    }
    const pendingGrade = gradeRows[0];
    if (pendingGrade && (Number(pendingGrade.total) || 0) > 0) {
      const ts = toTs(pendingGrade.updated_at);
      items.push({
        id: `teacher-to-grade-${ts}`,
        kind: "nilai",
        title: `${Number(pendingGrade.total)} tugas menunggu penilaian`,
        detail: "Buka Kelas Digital → tab Nilai",
        time: relativeLabel(pendingGrade.updated_at as string),
        ts,
      });
    }
    for (const row of annRows) {
      items.push({
        id: `ann-${text(row.id)}`,
        kind: "pengumuman",
        title: `Pengumuman: ${text(row.title)}`,
        detail: snippet(row.body),
        time: relativeLabel(row.published_at as string),
        ts: toTs(row.published_at),
      });
    }
  }

  if (account.role === "admin") {
    const [modRows, joinRows, accountRows, annRows] = await Promise.all([
      sql`
        select
          (select count(*)::int from achievements where status = 'pending') +
          (select count(*)::int from news where status = 'pending') +
          (select count(*)::int from announcements where status = 'pending') +
          (select count(*)::int from moderation_queue where status = 'pending') as total,
          greatest(
            (select max(created_at) from achievements where status = 'pending'),
            (select max(created_at) from news where status = 'pending'),
            (select max(published_at) from announcements where status = 'pending'),
            (select max(created_at) from moderation_queue where status = 'pending')
          ) as latest
      ` as Promise<Row[]>,
      sql`
        select count(*)::int as total, max(requested_at) as latest
        from class_members where enrolled = false
      ` as Promise<Row[]>,
      sql`
        select count(*)::int as total, max(created_at) as latest
        from accounts where created_at >= current_date
      ` as Promise<Row[]>,
      sql`
        select id, title, body, published_at
        from announcements
        where status = 'published' and audience = 'all'
        order by published_at desc
        limit 5
      ` as Promise<Row[]>,
    ]);

    const mod = modRows[0];
    if (mod && (Number(mod.total) || 0) > 0) {
      const ts = toTs(mod.latest);
      items.push({
        id: `admin-moderation-${ts}`,
        kind: "moderasi",
        title: `${Number(mod.total)} konten menunggu moderasi`,
        detail: "Tinjau di Manajemen Data",
        time: relativeLabel(mod.latest as string),
        ts,
      });
    }
    const join = joinRows[0];
    if (join && (Number(join.total) || 0) > 0) {
      const ts = toTs(join.latest);
      items.push({
        id: `admin-join-requests-${ts}`,
        kind: "permintaan",
        title: `${Number(join.total)} permintaan bergabung ke kelas`,
        detail: "Menunggu persetujuan guru kelas",
        time: relativeLabel(join.latest as string),
        ts,
      });
    }
    const acc = accountRows[0];
    if (acc && (Number(acc.total) || 0) > 0) {
      const ts = toTs(acc.latest);
      items.push({
        id: `admin-new-accounts-${ts}`,
        kind: "akun",
        title: `${Number(acc.total)} akun baru hari ini`,
        detail: "Lihat di Data Pengguna",
        time: relativeLabel(acc.latest as string),
        ts,
      });
    }
    for (const row of annRows) {
      items.push({
        id: `ann-${text(row.id)}`,
        kind: "pengumuman",
        title: `Pengumuman: ${text(row.title)}`,
        detail: snippet(row.body),
        time: relativeLabel(row.published_at as string),
        ts: toTs(row.published_at),
      });
    }
  }

  return items.sort((a, b) => b.ts - a.ts).slice(0, 15);
}

/** GET /api/notifications — notifikasi live sesuai peran akun */
export async function GET() {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ data: [], source: "none" });
  }

  try {
    const data = await buildNotifications({
      role: String(account.role),
      name: account.name,
      studentId: account.studentId,
    });
    return NextResponse.json({ data, source: "db" });
  } catch {
    return NextResponse.json({ data: [], source: "error" });
  }
}

/** POST /api/notifications — status baca kini dikelola di klien. */
export async function POST(request: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  void request;
  return NextResponse.json({ ok: true });
}
