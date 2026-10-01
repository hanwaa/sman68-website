import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, updateTag } from "next/cache";
import { purgeContentCache } from "@/lib/content-cache";
import { dbConfigured, getDb } from "@/lib/db";
import { trackScale, trafficSampled } from "@/lib/track-sample";
import { hashPassword } from "@/lib/auth";
import { requireRole, safeErrorMessage } from "@/lib/api-auth";
import { guardMutation, readJsonLimited, CMS_BODY_LIMIT } from "@/lib/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const text = (v: unknown) => (v == null ? "" : String(v));

const ROLE_LABEL: Record<string, string> = {
  student: "Siswa",
  teacher: "Guru",
  admin: "Admin",
};

const ROLE_VALUE: Record<string, string> = {
  Siswa: "student",
  Guru: "teacher",
  Admin: "admin",
};

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

// Cache server 45 dtk untuk resource=stats: 27 subselect + 3 agregat berat
// tidak perlu dihitung ulang setiap poll dashboard (60 dtk per admin).
type StatsCache = { at: number; body: unknown };
let statsCache: StatsCache | null = null;
const STATS_TTL_MS = 45_000;

/** Pastikan akun siswa tertaut ke baris `students` (join kelas & absensi butuh student_id). */
async function ensureStudentLink(accountId: string, username: string, name: string, detail: string) {
  const sql = getDb();
  const classDetail = detail && detail !== "-" ? detail : null;
  const accountRows = (await sql`
    select student_id from accounts where id = ${accountId} limit 1
  `) as Row[];
  const currentId = accountRows[0]?.student_id ? text(accountRows[0].student_id) : null;

  if (currentId) {
    await sql`
      update students
      set name = ${name}, class_name = coalesce(${classDetail}, class_name)
      where id = ${currentId}
    `;
    return currentId;
  }

  const existing = (await sql`
    select id from students where nisn = ${username} limit 1
  `) as Row[];
  const studentId = existing[0] ? text(existing[0].id) : `acc-${accountId}`;

  if (existing[0]) {
    await sql`
      update students
      set name = ${name}, class_name = coalesce(${classDetail}, class_name)
      where id = ${studentId}
    `;
  } else {
    await sql`
      insert into students (id, name, class_name, nisn)
      values (${studentId}, ${name}, ${classDetail ?? "XI IPA 3"}, ${username})
      on conflict (id) do update set name = excluded.name, nisn = excluded.nisn
    `;
  }
  await sql`update accounts set student_id = ${studentId} where id = ${accountId}`;
  return studentId;
}

/** Pastikan akun guru tertaut ke baris `teachers` (wali kelas & absensi butuh teacher_id). */
async function ensureTeacherLink(accountId: string, username: string, name: string, detail: string) {
  const sql = getDb();
  const subject = detail && detail !== "-" ? detail : null;
  const accountRows = (await sql`
    select teacher_id from accounts where id = ${accountId} limit 1
  `) as Row[];
  const currentId = accountRows[0]?.teacher_id ? text(accountRows[0].teacher_id) : null;

  if (currentId) {
    await sql`
      update teachers set name = ${name}, subject = coalesce(${subject}, subject)
      where id = ${currentId}
    `;
    return currentId;
  }

  const existing = (await sql`
    select id from teachers where nig = ${username} limit 1
  `) as Row[];
  const teacherId = existing[0] ? text(existing[0].id) : `acc-${accountId}`;

  if (existing[0]) {
    await sql`update teachers set name = ${name} where id = ${teacherId}`;
  } else {
    await sql`
      insert into teachers (id, name, nig, subject)
      values (${teacherId}, ${name}, ${username}, ${subject})
      on conflict (id) do update set name = excluded.name, nig = excluded.nig
    `;
  }
  await sql`update accounts set teacher_id = ${teacherId} where id = ${accountId}`;
  return teacherId;
}

/** GET /api/admin?resource=users|moderation|stats */
export async function GET(request: NextRequest) {
  const account = await requireRole(["admin"]);
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ data: [], source: "none" });
  }
  const resource = request.nextUrl.searchParams.get("resource");
  const sql = getDb();

  if (resource === "users") {
    // Agregasi sesi dihitung sekali via GROUP BY (bukan 2 correlated subquery
    // per baris = 2000 probe untuk LIMIT 1000).
    const rows = (await sql`
      select a.id, a.username, a.role, a.name, a.detail, a.status, a.created_at,
             s.nisn, s.class_name,
             t.nig, t.subject, t.position,
             (select hc.name from homeroom_classes hc where hc.teacher_id = a.teacher_id limit 1) as homeroom_name,
             coalesce(sess.active_sessions, 0)::int as active_sessions,
             lastlog.last_login_at as last_login_at
      from accounts a
      left join students s on s.id = a.student_id
      left join teachers t on t.id = a.teacher_id
      left join (
        select account_id, count(*)::int as active_sessions
        from auth_sessions
        where expires_at > now() and last_seen_at > now() - interval '5 minutes'
        group by account_id
      ) sess on sess.account_id = a.id
      left join (
        select account_id, max(created_at) as last_login_at
        from auth_sessions
        group by account_id
      ) lastlog on lastlog.account_id = a.id
      order by case a.role when 'admin' then 0 when 'teacher' then 1 else 2 end, a.name asc
      limit 1000
    `) as Row[];
    const nullableText = (value: unknown) => (value == null ? null : text(value));
    const toIso = (value: unknown) => {
      if (value == null) return null;
      const date = new Date(String(value));
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    };
    return NextResponse.json({
      data: rows.map((row) => ({
        id: text(row.id),
        name: text(row.name),
        username: text(row.username),
        role: ROLE_LABEL[text(row.role)] ?? "Siswa",
        roleKey: text(row.role) || "student",
        detail: text(row.detail) || "-",
        status: text(row.status) || "Aktif",
        nisn: nullableText(row.nisn),
        className: nullableText(row.class_name),
        nig: nullableText(row.nig),
        subject: nullableText(row.subject),
        position: nullableText(row.position),
        homeroomName: nullableText(row.homeroom_name),
        activeSessions: Number(row.active_sessions) || 0,
        lastLoginAt: toIso(row.last_login_at),
        createdAt: toIso(row.created_at),
      })),
      source: "db",
    });
  }

  if (resource === "classes") {
    const rows = (await sql`
      select class_name
      from students
      where class_name is not null and class_name <> ''
      group by class_name
      order by length(class_name), class_name
    `) as Row[];
    return NextResponse.json({ data: rows.map((row) => text(row.class_name)), source: "db" });
  }

  if (resource === "stats") {
    if (statsCache && Date.now() - statsCache.at < STATS_TTL_MS) {
      return NextResponse.json(statsCache.body);
    }
    const [rows, weekly, topPages] = await Promise.all([
      sql`
        select
          (select count(*)::int from students) as students,
          (select count(*)::int from accounts where role = 'teacher' and status = 'Aktif') as teachers,
          (select count(*)::int from accounts where role = 'admin' and status = 'Aktif') as admins,
          (select count(*)::int from accounts where status = 'Aktif') as active_users,
          (select count(*)::int from news where status = 'published') as news,
          (select count(*)::int from news where status in ('draft', 'pending')) as news_draft,
          (select count(*)::int from announcements where status = 'published') as announcements,
          (select count(*)::int from achievements) as achievements,
          (select count(*)::int from achievements where status = 'pending') as achievements_pending,
          (select count(*)::int from extracurriculars) as extracurriculars,
          (select count(*)::int from alumni) as alumni,
          (select count(*)::int from classes) as classes,
          (select count(*)::int from class_assignments) as assignments,
          (select count(*)::int from class_submissions where status = 'turned_in') as submissions_pending,
          (select count(*)::int from events where start_at >= now()) as events_upcoming,
          (select count(distinct account_id)::int from auth_sessions
            where expires_at > now() and last_seen_at > now() - interval '5 minutes') as online_sessions,
          (select count(*)::int from auth_sessions where created_at >= current_date) as logins_today,
          (select count(*)::int from attendance where date = current_date and status = 'Masuk') as present_today,
          (select count(*)::int from site_visits where day = current_date) as visitors_today,
          (select coalesce(sum(views), 0)::int from page_views where day = current_date) as pageviews_today,
          (select coalesce(sum(views), 0)::int from page_views) as pageviews_total,
          (select count(*)::int from moderation_queue where status = 'pending') as moderation_queue,
          (select count(*)::int from news where status = 'pending') as news_pending,
          (select count(*)::int from announcements where status = 'pending') as announcements_pending,
          (select count(*)::int from accounts where role = 'student') as role_student,
          (select count(*)::int from accounts where role = 'teacher') as role_teacher,
          (select count(*)::int from accounts where role = 'admin') as role_admin
      ` as Promise<Row[]>,
      sql`
        select to_char(d::date, 'YYYY-MM-DD') as day,
               coalesce(v.visitors, 0)::int as visitors,
               coalesce(p.pageviews, 0)::int as pageviews
        from generate_series(current_date - interval '6 days', current_date, interval '1 day') as d
        left join (
          select day, count(*)::int as visitors
          from site_visits
          where day >= current_date - interval '6 days'
          group by day
        ) v on v.day = d::date
        left join (
          select day, sum(views)::int as pageviews
          from page_views
          where day >= current_date - interval '6 days'
          group by day
        ) p on p.day = d::date
        order by d
      ` as Promise<Row[]>,
      sql`
        select path, sum(views)::int as views
        from page_views
        group by path
        order by views desc
        limit 7
      ` as Promise<Row[]>,
    ]);
    const row = rows[0];
    // Angka traffic dikali skala sampling agar merepresentasikan kunjungan
    // penuh (lihat TRACK_SAMPLE_RATE). Flag sampled ikut ke UI sebagai label.
    const scale = trackScale();
    const sampled = trafficSampled();
    const moderationPending =
      (Number(row.moderation_queue) || 0) +
      (Number(row.achievements_pending) || 0) +
      (Number(row.news_pending) || 0) +
      (Number(row.announcements_pending) || 0);

    const payload = {
      data: {
        students: Number(row.students) || 0,
        teachers: Number(row.teachers) || 0,
        admins: Number(row.admins) || 0,
        activeUsers: Number(row.active_users) || 0,
        news: Number(row.news) || 0,
        newsDraft: Number(row.news_draft) || 0,
        announcements: Number(row.announcements) || 0,
        achievements: Number(row.achievements) || 0,
        achievementsPending: Number(row.achievements_pending) || 0,
        extracurriculars: Number(row.extracurriculars) || 0,
        alumni: Number(row.alumni) || 0,
        classes: Number(row.classes) || 0,
        assignments: Number(row.assignments) || 0,
        submissionsPending: Number(row.submissions_pending) || 0,
        eventsUpcoming: Number(row.events_upcoming) || 0,
        onlineSessions: Number(row.online_sessions) || 0,
        loginsToday: Number(row.logins_today) || 0,
        presentToday: Number(row.present_today) || 0,
        visitorsToday: (Number(row.visitors_today) || 0) * scale,
        pageviewsToday: (Number(row.pageviews_today) || 0) * scale,
        pageviewsTotal: (Number(row.pageviews_total) || 0) * scale,
        trafficSampled: sampled,
        trafficScale: scale,
        moderationPending,
        roles: {
          student: Number(row.role_student) || 0,
          teacher: Number(row.role_teacher) || 0,
          admin: Number(row.role_admin) || 0,
        },
        weekly: weekly.map((item) => ({
          day: text(item.day),
          visitors: (Number(item.visitors) || 0) * scale,
          pageviews: (Number(item.pageviews) || 0) * scale,
        })),
        topPages: topPages.map((item) => ({
          path: text(item.path),
          views: (Number(item.views) || 0) * scale,
        })),
        updatedAt: new Date().toISOString(),
      },
      source: "db",
    };
    statsCache = { at: Date.now(), body: payload };
    return NextResponse.json(payload);
  }

  if (resource === "moderation") {
    const rows = (await sql`
      select id::text as id, 'queue' as source, type, title, author, created_at
      from moderation_queue
      where status = 'pending'
      union all
      select id::text as id, 'achievements' as source, 'Prestasi' as type, title,
             coalesce(student_name, 'Siswa') as author, created_at
      from achievements
      where status = 'pending'
      union all
      select id::text as id, 'news' as source, 'Berita' as type, title,
             coalesce(author, 'Admin') as author, published_at as created_at
      from news
      where status = 'pending'
      union all
      select id::text as id, 'announcements' as source, 'Pengumuman' as type, title,
             coalesce(author, 'Admin') as author, published_at as created_at
      from announcements
      where status = 'pending'
      order by created_at asc
    `) as Row[];
    return NextResponse.json({
      data: rows.map((row) => ({
        id: text(row.id),
        source: text(row.source),
        type: text(row.type),
        title: text(row.title),
        author: text(row.author),
        time: relativeLabel(row.created_at as string | null),
        status: "pending",
      })),
      source: "db",
    });
  }

  return NextResponse.json({ error: "resource wajib: users | moderation" }, { status: 400 });
}

/** POST /api/admin { action: create-user | toggle-user | approve | reject } */
export async function POST(request: NextRequest) {
  const rejected = guardMutation(request, { maxBytes: CMS_BODY_LIMIT });
  if (rejected) return rejected;
  const account = await requireRole(["admin"]);
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const body = (await readJsonLimited<{
    action?: string;
    id?: string;
    source?: string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
    detail?: string;
    status?: string;
  }>(request, CMS_BODY_LIMIT)) as {
    action?: string;
    id?: string;
    source?: string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
    detail?: string;
    status?: string;
  } | null;

  const sql = getDb();

  try {
    switch (body?.action) {
      case "create-user": {
        if (!body.name || !body.email) throw new Error("Nama dan username/NISN wajib diisi.");
        const username = body.email.trim().toLowerCase();
        // Password awal acak (bukan = username yang semi-publik). Dikembalikan
        // sekali di respons agar admin bisa menyampaikannya ke user.
        const { randomBytes } = await import("node:crypto");
        const initialPassword = randomBytes(9).toString("base64url");
        const rows = (await sql`
          insert into accounts (username, password_hash, role, name, detail, status)
          values (${username}, ${await hashPassword(initialPassword)},
                  ${ROLE_VALUE[body.role ?? "Siswa"] ?? "student"},
                  ${body.name}, ${body.detail ?? "-"}, ${"Aktif"})
          on conflict (username) do update set name = excluded.name,
            role = excluded.role, detail = excluded.detail
          returning id, username, role, name, detail, status
        `) as Row[];
        const row = rows[0];
        const accountId = text(row.id);
        const roleKey = text(row.role);
        if (roleKey === "student") {
          await ensureStudentLink(accountId, username, text(row.name), text(row.detail));
        } else if (roleKey === "teacher") {
          await ensureTeacherLink(accountId, username, text(row.name), text(row.detail));
        }
        statsCache = null;
        return NextResponse.json({
          data: {
            id: accountId,
            name: text(row.name),
            email: username,
            role: ROLE_LABEL[roleKey] ?? "Siswa",
            roleKey,
            detail: text(row.detail),
            status: text(row.status),
            initialPassword,
          },
        });
      }

      case "toggle-user": {
        if (!body.id) throw new Error("id user wajib diisi.");
        const rows = (await sql`
          update accounts
          set status = case when status = 'Aktif' then 'Nonaktif' else 'Aktif' end
          where id = ${body.id}
          returning status
        `) as Row[];
        if (!rows[0]) throw new Error("User tidak ditemukan.");
        return NextResponse.json({ ok: true, status: text(rows[0].status) });
      }

      case "reset-password": {
        if (!body.id) throw new Error("id user wajib diisi.");
        const target = (await sql`
          select username from accounts where id = ${body.id} limit 1
        `) as Row[];
        if (!target[0]) throw new Error("User tidak ditemukan.");
        const username = text(target[0].username);
        const { randomBytes: randomBytesReset } = await import("node:crypto");
        const newPassword = randomBytesReset(9).toString("base64url");
        await sql`
          update accounts set password_hash = ${await hashPassword(newPassword)} where id = ${body.id}
        `;
        statsCache = null;
        return NextResponse.json({ ok: true, username, newPassword });
      }

      case "update-user": {
        if (!body.id) throw new Error("id user wajib diisi.");
        if (!body.name?.trim() || !body.username?.trim()) {
          throw new Error("Nama dan username wajib diisi.");
        }
        const roleKey = ROLE_VALUE[body.role ?? "Siswa"] ?? "student";
        const status = body.status === "Nonaktif" ? "Nonaktif" : "Aktif";
        const detail = body.detail?.trim() || "-";
        try {
          const rows = (await sql`
            update accounts
            set name = ${body.name.trim()},
                username = ${body.username.trim().toLowerCase()},
                role = ${roleKey},
                detail = ${detail},
                status = ${status}
            where id = ${body.id}
            returning id, username, role, name, detail, status
          `) as Row[];
          if (!rows[0]) throw new Error("User tidak ditemukan.");
          const row = rows[0];

          // Pastikan akun tetap tertaut ke data siswa/guru (join kelas, absensi, wali kelas).
          const nextUsername = body.username.trim().toLowerCase();
          if (roleKey === "student") {
            await ensureStudentLink(body.id, nextUsername, body.name.trim(), detail);
          } else if (roleKey === "teacher") {
            await ensureTeacherLink(body.id, nextUsername, body.name.trim(), detail);
          }
          return NextResponse.json({
            data: {
              id: text(row.id),
              name: text(row.name),
              username: text(row.username),
              role: ROLE_LABEL[text(row.role)] ?? "Siswa",
              roleKey: text(row.role),
              detail: text(row.detail) || "-",
              status: text(row.status),
            },
          });
        } catch (error) {
          const code =
            typeof error === "object" && error !== null && "code" in error
              ? String((error as { code?: unknown }).code)
              : "";
          if (code === "23505") throw new Error("Username sudah dipakai akun lain.");
          throw error;
        }
      }

      case "delete-user": {
        if (!body.id) throw new Error("id user wajib diisi.");
        if (body.id === account.id) {
          throw new Error("Akun yang sedang digunakan tidak bisa dihapus.");
        }
        const target = (await sql`
          select role from accounts where id = ${body.id} limit 1
        `) as Row[];
        if (!target[0]) throw new Error("User tidak ditemukan.");
        if (text(target[0].role) === "admin") {
          const adminCount = (await sql`
            select count(*)::int as count
            from accounts where role = 'admin' and status = 'Aktif'
          `) as Row[];
          if ((Number(adminCount[0]?.count) || 0) <= 1) {
            throw new Error("Admin aktif terakhir tidak bisa dihapus.");
          }
        }
        await sql`delete from accounts where id = ${body.id}`;
        // Bersihkan baris siswa/guru yang dibuat otomatis untuk akun ini (bila tidak dipakai akun lain).
        await sql`
          delete from students
          where id = ${`acc-${body.id}`}
            and not exists (select 1 from accounts a where a.student_id = ${`acc-${body.id}`})
        `;
        await sql`
          delete from teachers
          where id = ${`acc-${body.id}`}
            and not exists (select 1 from accounts a where a.teacher_id = ${`acc-${body.id}`})
        `;
        return NextResponse.json({ ok: true });
      }

      case "approve":
      case "reject": {
        if (!body.id) throw new Error("id konten wajib diisi.");
        const approved = body.action === "approve";
        switch (body.source) {
          case "achievements":
            // Disetujui → draft: admin lengkapi datanya dulu sebelum publikasi.
            await sql`
              update achievements
              set status = ${approved ? "draft" : "rejected"}
              where id = ${body.id}
            `;
            break;
          case "news":
            await sql`
              update news
              set status = ${approved ? "published" : "archived"}
              where id = ${body.id}
            `;
            break;
          case "announcements":
            await sql`
              update announcements
              set status = ${approved ? "published" : "archived"}
              where id = ${body.id}
            `;
            break;
          default:
            await sql`
              update moderation_queue
              set status = ${approved ? "approved" : "rejected"}
              where id = ${body.id}
            `;
        }
        // Status konten berubah → segarkan cache halaman publik.
        revalidatePath("/", "layout");
        updateTag("cms");
        purgeContentCache();
        statsCache = null;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: "action tidak dikenal." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 400 });
  }
}
