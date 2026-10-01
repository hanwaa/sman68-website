import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import { requireAccount, safeErrorMessage } from "@/lib/api-auth";
import type { SessionAccount } from "@/lib/auth";
import { randomUUID } from "node:crypto";
import { guardMutation, readJsonLimited } from "@/lib/api-guard";
import {
  classInitials,
  type ClassAssignment,
  type ClassComment,
  type ClassPost,
  type ClassroomClass,
  type ClassroomStore,
  type ClassSubmission,
} from "@/lib/classroom";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

const text = (value: unknown) => (value == null ? "" : String(value));

/** Link tugas wajib Google Drive/Docs (disamakan dengan validasi klien). */
function isDriveUrl(value: unknown): boolean {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host === "drive.google.com" || host === "docs.google.com";
  } catch {
    return false;
  }
}

/**
 * Lampiran post/tugas: wajib https: (menolak javascript:, data:, file:, dll.)
 * agar URL jahat tidak tersimpan lalu dirender sebagai <a href> di dashboard.
 */
function isSafeAttachmentUrl(value: unknown): boolean {
  if (value == null || value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname.length > 0;
  } catch {
    return false;
  }
}

function badUrl(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
const driveType = (url: string | null) =>
  url && /drive|docs\.google\.com/i.test(url) ? "drive" : "file";

function relativeLabel(iso: string | null | undefined): string {
  if (!iso) return "Baru saja";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export type ClassroomScope = {
  /** null = semua kelas (admin). Array kosong = tidak ada akses. */
  classIds: string[] | null;
  /** Nama siswa pemilik request; submission orang lain disembunyikan. null = tampil semua (guru/admin). */
  ownStudentName: string | null;
  /** ID siswa pemilik request (stabil, unik). Dipakai untuk enrolled/pending & filter submission. */
  ownStudentId: string | null;
};

const BAWAN_COLORS = ["bg-brand-pine", "bg-brand-green", "bg-brand-green-deep"];

const bawaanClassId = (homeroomId: string) => `walikelas-${homeroomId.replace(/\./g, "-")}`;
const bawaanCode = (homeroomId: string) => `WALI-${homeroomId.replace(/\./g, "").toUpperCase()}`;

function bawaanColor(homeroomId: string): string {
  let hash = 0;
  for (const ch of homeroomId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return BAWAN_COLORS[hash % BAWAN_COLORS.length];
}

type HomeroomRow = {
  id: string;
  name: string;
  room: string;
  teacherId: string | null;
  teacherName: string;
};

/**
 * Pastikan kelas digital bawaan rombel selalu ada (idempoten).
 * Dipanggil di GET sebelum scope dihitung sehingga wali kelas + seluruh
 * anggota rombel langsung melihat kelas bawaannya tanpa join/ACC manual.
 * Tidak pernah melempar, kegagalan ensure tak boleh menggagalkan baca.
 */
async function ensureBawaanClass(
  sql: ReturnType<typeof getDb>,
  homeroom: HomeroomRow,
  waliName: string,
  teacherSubject: string | null
): Promise<void> {
  const classId = bawaanClassId(homeroom.id);
  const code = bawaanCode(homeroom.id);
  const subject = teacherSubject ?? "Wali Kelas";
  const className = `Kelas ${homeroom.name}`;
  const description = `Kelas digital wali kelas ${homeroom.name}, ${waliName}.`;
  await sql`
    insert into classes (id, name, subject, section, room, code, teacher_name, teacher_initials, color, description)
    values (${classId}, ${className}, ${subject}, ${homeroom.name}, ${homeroom.room}, ${code},
            ${waliName}, ${classInitials(waliName)}, ${bawaanColor(homeroom.id)}, ${description})
    on conflict (id) do update set
      teacher_name = excluded.teacher_name,
      teacher_initials = excluded.teacher_initials
  `;
  // Seluruh anggota rombel langsung enrolled (guru + murid sama-sama melihat).
  await sql`
    insert into class_members (class_id, student_id, enrolled)
    select ${classId}, s.id, true from students s where s.class_name = ${homeroom.name}
    on conflict (class_id, student_id) do update set enrolled = true
  `;
  // Jaga konsistensi nama wali di tabel rombel (admin rename tak menyentuhnya).
  await sql`
    update homeroom_classes set teacher_name = ${waliName}
    where id = ${homeroom.id} and teacher_name <> ${waliName}
  `;
  // Konten awal bawaan (samakan dengan seed), hanya saat kelas baru dibuat.
  const postId = `post-${classId}`;
  await sql`
    insert into class_posts (id, class_id, author_name, initials, content, kind)
    values (${postId}, ${classId}, ${waliName}, ${classInitials(waliName)},
            ${`Selamat datang di kelas digital ${homeroom.name}! Gunakan ruang ini untuk melihat materi, tugas, dan pengumuman kelas. Jangan ragu bertanya di kolom komentar.`},
            'announcement')
    on conflict (id) do nothing
  `;
  const assignmentId = `asg-${classId}`;
  await sql`
    insert into class_assignments (id, class_id, title, instructions, topic, due_at, due_label, points)
    values (${assignmentId}, ${classId}, ${"Kontrak Belajar & Perkenalan Diri"},
            ${"Tulis perkenalan singkat (nama, asal SMP, minat belajar, dan target semester ini) lalu unggah tautan dokumen. Sertakan juga kesepakatan belajar kelas."},
            ${"Orientasi"}, ${(new Date(Date.now() + 7 * 86400000)).toISOString()}, ${"7 hari lagi"}, ${100})
    on conflict (id) do nothing
  `;
  await sql`
    insert into class_submissions (id, assignment_id, student_id, status)
    select ${assignmentId} || '-' || s.id, ${assignmentId}, s.id, 'assigned'
    from students s where s.class_name = ${homeroom.name}
    on conflict (assignment_id, student_id) do nothing
  `;
}

/** Resolve nama wali aktif (sumber kebenaran = accounts.name, yang dipakai scope guru). */
async function resolveWaliName(
  sql: ReturnType<typeof getDb>,
  homeroom: HomeroomRow,
  account: SessionAccount
): Promise<{ waliName: string; subject: string | null }> {
  if (account.role === "teacher" && account.teacherId && homeroom.teacherId === account.teacherId) {
    const t = (await sql`
      select subject from teachers where id = ${account.teacherId} limit 1
    `) as Row[];
    return {
      waliName: account.name,
      subject: t[0]?.subject == null ? null : String(t[0].subject),
    };
  }
  if (homeroom.teacherId) {
    const rows = (await sql`
      select a.name as account_name, t.subject as subject
      from homeroom_classes h
      left join accounts a on a.teacher_id = h.teacher_id and a.status = 'Aktif'
      left join teachers t on t.id = h.teacher_id
      where h.id = ${homeroom.id}
      limit 1
    `) as Row[];
    const row = rows[0];
    const waliName =
      (row?.account_name == null ? null : String(row.account_name)) ??
      account.name;
    return {
      waliName,
      subject: row?.subject == null ? null : String(row.subject),
    };
  }
  return { waliName: homeroom.teacherName, subject: null };
}

/**
 * Pastikan peminta punya kelas bawaan sebelum scope dihitung:
 * - Guru wali kelas → bawaan rombel yang diampunya (+ seluruh murid enrolled).
 * - Murid → bawaan rombel sesuai class_name-nya (+ dirinya & roster enrolled).
 */
async function ensureDefaultClass(sql: ReturnType<typeof getDb>, account: SessionAccount): Promise<void> {
  if (account.role === "teacher" && account.teacherId) {
    const rows = (await sql`
      select id, name, room, teacher_id, teacher_name
      from homeroom_classes where teacher_id = ${account.teacherId} limit 1
    `) as Row[];
    if (!rows[0]) return;
    const homeroom: HomeroomRow = {
      id: String(rows[0].id),
      name: String(rows[0].name),
      room: String(rows[0].room ?? "-"),
      teacherId: rows[0].teacher_id == null ? null : String(rows[0].teacher_id),
      teacherName: String(rows[0].teacher_name),
    };
    const { waliName, subject } = await resolveWaliName(sql, homeroom, account);
    await ensureBawaanClass(sql, homeroom, waliName, subject);
    return;
  }
  if (account.role === "student") {
    const studentId = account.studentId;
    if (!studentId) return;
    const sRows = (await sql`
      select class_name from students where id = ${studentId} limit 1
    `) as Row[];
    const className = sRows[0]?.class_name == null ? null : String(sRows[0].class_name);
    if (!className) return;
    const hRows = (await sql`
      select id, name, room, teacher_id, teacher_name
      from homeroom_classes where name = ${className} limit 1
    `) as Row[];
    if (!hRows[0]) return;
    const homeroom: HomeroomRow = {
      id: String(hRows[0].id),
      name: String(hRows[0].name),
      room: String(hRows[0].room ?? "-"),
      teacherId: hRows[0].teacher_id == null ? null : String(hRows[0].teacher_id),
      teacherName: String(hRows[0].teacher_name),
    };
    const { waliName, subject } = await resolveWaliName(sql, homeroom, account);
    await ensureBawaanClass(sql, homeroom, waliName, subject);
  }
}

async function loadStore(
  studentName: string,
  teacherName: string,
  scope: ClassroomScope
): Promise<ClassroomStore> {
  const sql = getDb();
  const { classIds, ownStudentName, ownStudentId } = scope;

  // Scope di database (bukan filter di JS): tiap query hanya memuat baris
  // kelas yang boleh dilihat peminta. Sebelumnya 6 query memuat SELURUH tabel.
  // Struktur WHERE dari konstanta; nilai ID selalu lewat parameter ($1).
  const scoped = classIds !== null;
  const ids = scoped ? (classIds as string[]) : [];

  const [classRows, memberRows, postRows, assignmentRows] = await Promise.all([
    sql.query(
      `select id, name, subject, section, room, code, teacher_name, teacher_initials, color, description
       from classes ${scoped ? "where id = any($1)" : ""}
       order by created_at asc
       ${scoped ? "" : "limit 200"}`,
      scoped ? [ids] : []
    ),
    sql.query(
      `select cm.class_id, s.id as student_id, s.name, cm.enrolled, cm.requested_at
       from class_members cm
       join students s on s.id = cm.student_id
       ${scoped ? "where cm.class_id = any($1)" : ""}
       ${scoped ? "" : "limit 2000"}`,
      scoped ? [ids] : []
    ),
    sql.query(
      `select id, class_id, author_name, initials, content, kind, attachment_name, attachment_url, created_at
       from class_posts
       ${scoped ? "where class_id = any($1)" : ""}
       order by created_at desc
       ${scoped ? "" : "limit 200"}`,
      scoped ? [ids] : []
    ),
    sql.query(
      `select id, class_id, title, instructions, topic, due_at, due_label, points,
              attachment_name, attachment_url
       from class_assignments
       ${scoped ? "where class_id = any($1)" : ""}
       order by due_at asc nulls last, created_at asc
       ${scoped ? "" : "limit 200"}`,
      scoped ? [ids] : []
    ),
  ]);

  // Fase 2: komentar & submission hanya untuk post/tugas yang terlihat.
  // Melewatkan query bila tidak ada (hemat 2 round-trip untuk user tanpa kelas).
  const postIds = postRows.map((row) => text(row.id));
  const assignmentIds = assignmentRows.map((row) => text(row.id));
  const [commentRows, submissionRows] = await Promise.all([
    postIds.length === 0
      ? Promise.resolve([] as Row[])
      : (sql`
        select id, post_id, author_name, initials, content, created_at
        from class_comments
        where post_id = any(${postIds})
        order by created_at asc
      ` as Promise<Row[]>),
    assignmentIds.length === 0
      ? Promise.resolve([] as Row[])
      : (sql`
        select cs.id, cs.assignment_id, cs.student_id, s.name as student_name, cs.status, cs.submitted_at,
               cs.drive_url, cs.grade, cs.feedback
        from class_submissions cs
        join students s on s.id = cs.student_id
        where cs.assignment_id = any(${assignmentIds})
      ` as Promise<Row[]>),
  ]);

  // Grouping O(n) via Map (ganti filter-per-baris yang kuadratik).
  const membersByClass = new Map<string, Row[]>();
  for (const m of memberRows) {
    const cid = text(m.class_id);
    const list = membersByClass.get(cid);
    if (list) list.push(m);
    else membersByClass.set(cid, [m]);
  }
  const commentsByPost = new Map<string, Row[]>();
  for (const c of commentRows) {
    const pid = text(c.post_id);
    const list = commentsByPost.get(pid);
    if (list) list.push(c);
    else commentsByPost.set(pid, [c]);
  }
  const submissionsByAssignment = new Map<string, Row[]>();
  for (const s of submissionRows) {
    const aid = text(s.assignment_id);
    const list = submissionsByAssignment.get(aid);
    if (list) list.push(s);
    else submissionsByAssignment.set(aid, [s]);
  }

  const classes: ClassroomClass[] = classRows.map((row) => {
    const classId = text(row.id);
    const members = membersByClass.get(classId) ?? [];
    const approved = members.filter((m) => Boolean(m.enrolled));
    const waiting = members.filter((m) => !m.enrolled);
    // Identitas keanggotaan peminta wajib pakai student_id (stabil & unik).
    // Pencocokan nama sebelumnya rapuh: nama bisa berubah/diduplikat sehingga
    // murid yang sudah enrolled terlihat belum gabung (kelas bawaan hilang).
    const myMembership = ownStudentId
      ? members.find((m) => text(m.student_id) === ownStudentId)
      : undefined;
    const enrolledById = myMembership ? Boolean(myMembership.enrolled) : false;
    const pendingById = myMembership ? !myMembership.enrolled : false;
    return {
      id: classId,
      name: text(row.name),
      section: text(row.section),
      subject: text(row.subject),
      room: text(row.room),
      code: text(row.code),
      teacher: text(row.teacher_name),
      teacherInitials: text(row.teacher_initials) || classInitials(text(row.teacher_name)),
      color: text(row.color) || "bg-brand-pine",
      description: text(row.description),
      enrolled: ownStudentId ? enrolledById : approved.some((m) => text(m.name) === studentName),
      pending: ownStudentId ? pendingById : waiting.some((m) => text(m.name) === studentName),
      teacherOwned: text(row.teacher_name) === teacherName,
      students: approved.map((m) => text(m.name)),
      requests: waiting.map((m) => ({
        id: text(m.student_id),
        name: text(m.name),
        initials: classInitials(text(m.name)),
        time: relativeLabel(m.requested_at as string | null),
      })),
    };
  });

  const posts: ClassPost[] = postRows.map((row) => {
    const attachmentUrl = (row.attachment_url as string | null) ?? null;
    const attachmentName = (row.attachment_name as string | null) ?? null;
    return {
      id: text(row.id),
      classId: text(row.class_id),
      author: text(row.author_name),
      initials: text(row.initials) || classInitials(text(row.author_name)),
      time: relativeLabel(row.created_at as string),
      content: text(row.content),
      kind: (row.kind === "material" ? "material" : "announcement") as ClassPost["kind"],
      attachment:
        attachmentUrl || attachmentName
          ? {
              name: attachmentName ?? "Lampiran",
              url: attachmentUrl ?? "#",
              type: driveType(attachmentUrl),
            }
          : undefined,
      comments: (commentsByPost.get(text(row.id)) ?? [])
        .map<ClassComment>((c) => ({
          id: text(c.id),
          author: text(c.author_name),
          initials: text(c.initials) || classInitials(text(c.author_name)),
          time: relativeLabel(c.created_at as string),
          text: text(c.content),
        })),
    };
  });

  const assignments: ClassAssignment[] = assignmentRows.map((row) => {
    const assignmentId = text(row.id);
    const attachmentUrl = (row.attachment_url as string | null) ?? null;
    const attachmentName = (row.attachment_name as string | null) ?? null;
    const dueAt = row.due_at ? new Date(row.due_at as string).getTime() : Date.now() + 7 * 86400000;
    return {
      id: assignmentId,
      classId: text(row.class_id),
      title: text(row.title),
      instructions: text(row.instructions),
      topic: text(row.topic) || "Umum",
      due: text(row.due_label) || "Belum dijadwalkan",
      dueTs: dueAt,
      points: Number(row.points) || 100,
      attachment:
        attachmentUrl || attachmentName
          ? {
              name: attachmentName ?? "Lampiran",
              url: attachmentUrl ?? "#",
              type: driveType(attachmentUrl),
            }
          : undefined,
      submissions: (submissionsByAssignment.get(assignmentId) ?? [])
        // Siswa hanya melihat submission miliknya (nilai/feedback orang lain
        // disembunyikan). Identitas pakai student_id; nama hanya fallback legacy.
        // Guru/admin (ownStudentId & ownStudentName null) melihat semua.
        .filter((s) =>
          ownStudentId !== null
            ? text(s.student_id) === ownStudentId
            : ownStudentName === null || text(s.student_name) === ownStudentName
        )
        .map<ClassSubmission>((s) => {
          const studentNameRow = text(s.student_name);
          return {
            student: studentNameRow,
            initials: classInitials(studentNameRow),
            status: text(s.status) as ClassSubmission["status"],
            submittedAt: s.submitted_at ? relativeLabel(s.submitted_at as string) : undefined,
            link: (s.drive_url as string | null) ?? undefined,
            grade: s.grade == null ? undefined : Number(s.grade),
            feedback: (s.feedback as string | null) ?? undefined,
          };
        }),
    };
  });

  return { classes, posts, assignments };
}

/** GET /api/classroom, store di-scope ke kelas milik peminta */
export async function GET(request: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  void request;
  const studentName = account.role === "student" ? account.name : "-";
  const teacherName = account.role === "teacher" ? account.name : "-";

  const emptyStore: ClassroomStore = { classes: [], posts: [], assignments: [] };

  if (!dbConfigured()) {
    return NextResponse.json({ store: emptyStore, source: "none" });
  }

  try {
    const sql = getDb();
    // Kelas bawaan rombel dipastikan ada dulu (wali + anggota langsung enrolled),
    // baru scope dihitung, jadi daftar tak pernah kosong untuk pemilik rombel.
    try {
      await ensureDefaultClass(sql, account);
    } catch {
      /* ensure tak boleh menggagalkan baca; lanjut dengan scope apa adanya */
    }
    let scope: ClassroomScope;
    if (account.role === "admin") {
      scope = { classIds: null, ownStudentName: null, ownStudentId: null };
    } else if (account.role === "teacher") {
      const rows = (await sql`
        select id from classes where teacher_name = ${account.name}
      `) as Row[];
      scope = { classIds: rows.map((r) => text(r.id)), ownStudentName: null, ownStudentId: null };
    } else {
      // Siswa: kelas yang diikuti (enrolled) + yang sedang diminta (pending).
      // Pakai student_id (stabil, terindex), bukan nama (tak unik, Seq Scan).
      const idRows = account.studentId
        ? ((await sql`
            select class_id from class_members where student_id = ${account.studentId}
          `) as Row[])
        : [];
      const ids = Array.from(
        new Set(idRows.map((r) => text(r.class_id)).filter(Boolean))
      );
      scope = { classIds: ids, ownStudentName: account.name, ownStudentId: account.studentId };
    }

    if (scope.classIds !== null && scope.classIds.length === 0) {
      return NextResponse.json({ store: emptyStore, source: "db" });
    }
    const store = await loadStore(studentName, teacherName, scope);
    return NextResponse.json({ store, source: "db" });
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
  }
}

type ActionBody = {
  action: string;
  classId?: string;
  code?: string;
  postId?: string;
  assignmentId?: string;
  studentId?: string;
  studentName?: string;
  teacherName?: string;
  authorName?: string;
  // payload umum
  name?: string;
  section?: string;
  subject?: string;
  room?: string;
  description?: string;
  content?: string;
  kind?: "announcement" | "material";
  attachmentName?: string;
  attachmentUrl?: string;
  title?: string;
  instructions?: string;
  topic?: string;
  due?: string;
  dueTs?: number;
  points?: number;
  link?: string;
  grade?: number;
  feedback?: string;
};

/** POST /api/classroom, semua mutasi kelas digital */
export async function POST(request: NextRequest) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const body = (await readJsonLimited<ActionBody>(request)) as ActionBody | null;
  if (!body?.action) {
    return NextResponse.json({ error: "action wajib diisi." }, { status: 400 });
  }

  const sql = getDb();
  const isStudent = account.role === "student";
  const isTeacher = account.role === "teacher";
  const isAdmin = account.role === "admin";
  const studentName = account.name;
  const teacherName = account.name;
  const deny = () => NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const classOwnedByTeacher = async (classId: string) => {
    if (isAdmin) return true;
    const rows = (await sql`
      select teacher_name from classes where id = ${classId} limit 1
    `) as Row[];
    return Boolean(rows[0]) && text(rows[0].teacher_name) === account.name;
  };

  // Akun siswa yang belum tertaut baris `students` otomatis dibuatkan agar bisa join kelas.
  let resolvedStudentId: string | null = account.studentId;
  const getStudentId = async (): Promise<string | null> => {
    if (resolvedStudentId) return resolvedStudentId;
    if (!isStudent) return null;
    const id = `acc-${account.id}`;
    await sql`
      insert into students (id, name, class_name, nisn)
      values (${id}, ${account.name}, ${account.detail || account.className || "XI IPA 3"}, ${account.username})
      on conflict (id) do update set name = excluded.name
    `;
    await sql`update accounts set student_id = ${id} where id = ${account.id} and student_id is null`;
    resolvedStudentId = id;
    return id;
  };

  const studentMemberOf = async (classId: string) => {
    const studentId = await getStudentId();
    if (!studentId) return false;
    const rows = (await sql`
      select 1 from class_members
      where class_id = ${classId} and student_id = ${studentId}
      limit 1
    `) as Row[];
    return rows.length > 0;
  };

  try {
    switch (body.action) {
      case "create-class": {
        if (isStudent) return deny();
        if (!body.name || !body.section) throw new Error("Nama dan kelas wajib diisi.");
        const id = `class-${randomUUID()}`;
        const prefix = body.name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase().padEnd(3, "X");
        const code = `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        await sql`
          insert into classes (id, name, subject, section, room, code, teacher_name, teacher_initials, color, description)
          values (${id}, ${body.name}, ${body.subject || body.name}, ${body.section}, ${body.room || "-"},
                  ${code}, ${teacherName}, ${classInitials(teacherName)}, ${"bg-brand-pine"},
                  ${body.description || `Kelas ${body.name} untuk ${body.section}.`})
        `;
        return NextResponse.json({ ok: true, id, code });
      }

      case "join-class": {
        const studentId = await getStudentId();
        if (!isStudent || !studentId) return deny();
        // Dukung gabung via kode kelas (wajib, karena store siswa di-scope
        // hanya ke kelas miliknya sehingga kode baru tak ada di daftar lokal).
        // classId tetap didukung untuk kompatibilitas klien lama.
        let targetClassId = body.classId?.trim() || null;
        let targetCode = body.code?.trim().toUpperCase() || null;
        if (!targetClassId && targetCode) {
          const found = (await sql`
            select id, code, name, section from classes
            where upper(code) = ${targetCode}
            limit 1
          `) as Row[];
          if (!found[0]) throw new Error(`Kode "${targetCode}" tidak ditemukan.`);
          targetClassId = text(found[0].id);
          targetCode = text(found[0].code);
        }
        if (!targetClassId) throw new Error("Kode kelas wajib diisi.");
        const existing = (await sql`
          select enrolled from class_members
          where class_id = ${targetClassId} and student_id = ${studentId}
          limit 1
        `) as Row[];
        if (existing[0] && Boolean(existing[0].enrolled)) {
          return NextResponse.json({ ok: true, pending: false, id: targetClassId, classId: targetClassId, already: true });
        }
        await sql`
          insert into class_members (class_id, student_id, enrolled, requested_at)
          values (${targetClassId}, ${studentId}, ${false}, now())
          on conflict (class_id, student_id) do nothing
        `;
        return NextResponse.json({ ok: true, pending: true, id: targetClassId, classId: targetClassId });
      }

      case "approve-member": {
        if (isStudent) return deny();
        if (!body.classId || !body.studentId) throw new Error("Data tidak lengkap.");
        if (!(await classOwnedByTeacher(body.classId))) return deny();
        const approved = (await sql`
          update class_members set enrolled = true
          where class_id = ${body.classId} and student_id = ${body.studentId}
          returning student_id
        `) as Row[];
        if (!approved[0]) throw new Error("Permintaan tidak ditemukan.");
        return NextResponse.json({ ok: true });
      }

      case "reject-member": {
        if (isStudent) return deny();
        if (!body.classId || !body.studentId) throw new Error("Data tidak lengkap.");
        if (!(await classOwnedByTeacher(body.classId))) return deny();
        await sql`
          delete from class_members
          where class_id = ${body.classId} and student_id = ${body.studentId} and enrolled = false
        `;
        return NextResponse.json({ ok: true });
      }

      case "delete-class": {
        if (isStudent) return deny();
        if (!body.classId) throw new Error("Kelas tidak ditemukan.");
        if (!(await classOwnedByTeacher(body.classId))) return deny();
        await sql`delete from classes where id = ${body.classId}`;
        return NextResponse.json({ ok: true });
      }

      case "add-post": {
        if (isStudent) return deny();
        if (!body.classId || !body.content?.trim()) throw new Error("Isi postingan wajib ada.");
        if (!isSafeAttachmentUrl(body.attachmentUrl)) {
          return badUrl("URL lampiran tidak valid (wajib https).");
        }
        if (!(await classOwnedByTeacher(body.classId))) return deny();
        const id = `post-${randomUUID()}`;
        await sql`
          insert into class_posts (id, class_id, author_name, initials, content, kind, attachment_name, attachment_url)
          values (${id}, ${body.classId}, ${teacherName}, ${classInitials(teacherName)},
                  ${body.content.trim()}, ${body.kind === "material" ? "material" : "announcement"},
                  ${body.attachmentName ?? null}, ${body.attachmentUrl ?? null})
          on conflict (id) do nothing
        `;
        return NextResponse.json({ ok: true, id });
      }

      case "add-comment": {
        if (!body.postId || !body.content?.trim()) throw new Error("Komentar wajib diisi.");
        const postRows = (await sql`
          select class_id from class_posts where id = ${body.postId} limit 1
        `) as Row[];
        if (!postRows[0]) throw new Error("Postingan tidak ditemukan.");
        const postClassId = text(postRows[0].class_id);
        if (isStudent && !(await studentMemberOf(postClassId))) return deny();
        if (isTeacher && !(await classOwnedByTeacher(postClassId))) return deny();
        const authorName = isStudent ? studentName : teacherName;
        const id = `c-${randomUUID()}`;
        await sql`
          insert into class_comments (id, post_id, author_name, initials, content)
          values (${id}, ${body.postId}, ${authorName}, ${classInitials(authorName)},
                  ${body.content.trim()})
          on conflict (id) do nothing
        `;
        return NextResponse.json({ ok: true, id });
      }

      case "create-assignment": {
        if (isStudent) return deny();
        if (!body.classId || !body.title) throw new Error("Judul tugas wajib diisi.");
        if (!isSafeAttachmentUrl(body.attachmentUrl)) {
          return badUrl("URL lampiran tidak valid (wajib https).");
        }
        if (!(await classOwnedByTeacher(body.classId))) return deny();
        const id = `asg-${randomUUID()}`;
        const dueTs = body.dueTs ?? Date.now() + 7 * 86400000;
        // Transaksi: assignment + bulk submissions harus atomik (sebelumnya
        // 2 statement autocommit → gagal di tengah = assignment yatim).
        await sql.transaction(async (query) => {
          await query(
            `insert into class_assignments (
              id, class_id, title, instructions, topic, due_at, due_label, points,
              attachment_name, attachment_url
            ) values (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
            on conflict (id) do nothing`,
            [
              id,
              body.classId,
              body.title,
              body.instructions ?? "",
              body.topic || "Umum",
              new Date(dueTs).toISOString(),
              body.due || "Belum dijadwalkan",
              body.points ?? 100,
              body.attachmentName ?? null,
              body.attachmentUrl ?? null,
            ]
          );

          const memberRows = (await query(
            `select cm.student_id from class_members cm where cm.class_id = $1`,
            [body.classId]
          )) as Row[];
          const submissionRows = memberRows.map((member) => ({
            id: `${id}-${text(member.student_id)}`,
            assignment_id: id,
            student_id: text(member.student_id),
            status: "assigned",
          }));
          if (submissionRows.length > 0) {
            await query(
              `insert into class_submissions (id, assignment_id, student_id, status)
              select x.id, x.assignment_id, x.student_id, x.status
              from jsonb_to_recordset($1::jsonb) as x(
                id text, assignment_id text, student_id text, status text
              )
              on conflict (assignment_id, student_id) do nothing`,
              [JSON.stringify(submissionRows)]
            );
          }
        });
        return NextResponse.json({ ok: true, id });
      }

      case "submit": {
        const studentId = await getStudentId();
        if (!isStudent || !studentId || !body.assignmentId || !body.link) {
          throw new Error("Link Google Drive wajib diisi.");
        }
        if (!isDriveUrl(body.link)) {
          return badUrl("Link tugas wajib URL Google Drive/Docs (https).");
        }
        const assignmentRows = (await sql`
          select class_id from class_assignments where id = ${body.assignmentId} limit 1
        `) as Row[];
        const classId = assignmentRows[0] ? text(assignmentRows[0].class_id) : null;
        if (!classId || !(await studentMemberOf(classId))) return deny();
        await sql`
          insert into class_submissions (
            id, assignment_id, student_id, status, submitted_at, drive_url, updated_at
          ) values (
            ${`${body.assignmentId}-${studentId}`}, ${body.assignmentId}, ${studentId},
            ${"turned_in"}, now(), ${body.link}, now()
          )
          on conflict (assignment_id, student_id) do update set
            status = case when class_submissions.status = 'graded' then 'graded' else 'turned_in' end,
            submitted_at = now(), drive_url = excluded.drive_url, updated_at = now()
        `;
        return NextResponse.json({ ok: true });
      }

      case "cancel-submit": {
        const studentId = await getStudentId();
        if (!isStudent || !studentId || !body.assignmentId) {
          throw new Error("Data tidak lengkap.");
        }
        await sql`
          update class_submissions
          set status = 'assigned', submitted_at = null, drive_url = null, updated_at = now()
          where assignment_id = ${body.assignmentId} and student_id = ${studentId}
        `;
        return NextResponse.json({ ok: true });
      }

      case "grade": {
        if (isStudent) return deny();
        if (!body.assignmentId || (!body.studentName && !body.studentId))
          throw new Error("Data tidak lengkap.");
        const assignmentRows = (await sql`
          select class_id from class_assignments where id = ${body.assignmentId} limit 1
        `) as Row[];
        const classId = assignmentRows[0] ? text(assignmentRows[0].class_id) : null;
        if (!classId || !(await classOwnedByTeacher(classId))) return deny();

        // Prefer studentId (stabil, PK lookup). studentName hanya fallback
        // legacy untuk klien lama (nama tak unik → batasi ke kelas ini).
        let targetId: string | null = null;
        if (body.studentId) {
          const idRows = (await sql`
            select s.id from students s
            join class_members cm on cm.student_id = s.id and cm.class_id = ${classId}
            where s.id = ${body.studentId}
            limit 1
          `) as Row[];
          targetId = idRows[0] ? text(idRows[0].id) : null;
        } else {
          const targetRows = (await sql`
            select s.id from students s
            join class_members cm on cm.student_id = s.id and cm.class_id = ${classId}
            where s.name = ${body.studentName}
            limit 1
          `) as Row[];
          targetId = targetRows[0] ? text(targetRows[0].id) : null;
        }
        if (!targetId) throw new Error("Siswa tidak ditemukan.");
        await sql`
          insert into class_submissions (id, assignment_id, student_id, status, grade, feedback, updated_at)
          values (${`${body.assignmentId}-${targetId}`}, ${body.assignmentId}, ${targetId},
                  ${body.grade == null ? "turned_in" : "graded"}, ${body.grade ?? null},
                  ${body.feedback ?? null}, now())
          on conflict (assignment_id, student_id) do update set
            status = case when ${body.grade ?? null}::int is null then class_submissions.status else 'graded' end,
            grade = coalesce(${body.grade ?? null}::int, class_submissions.grade),
            feedback = coalesce(${body.feedback ?? null}, class_submissions.feedback),
            updated_at = now()
        `;
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json({ error: `Action "${body.action}" tidak dikenal.` }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 400 });
  }
}
