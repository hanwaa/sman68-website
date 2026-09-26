import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import { requireAccount, safeErrorMessage } from "@/lib/api-auth";
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

async function loadStore(studentName: string, teacherName: string): Promise<ClassroomStore> {
  const sql = getDb();

  const [classRows, memberRows, postRows, commentRows, assignmentRows, submissionRows] =
    await Promise.all([
      sql`
        select id, name, subject, section, room, code, teacher_name, teacher_initials, color, description
        from classes
        order by created_at asc
      ` as Promise<Row[]>,
      sql`
        select cm.class_id, s.id as student_id, s.name, cm.enrolled, cm.requested_at
        from class_members cm
        join students s on s.id = cm.student_id
      ` as Promise<Row[]>,
      sql`
        select id, class_id, author_name, initials, content, kind, attachment_name, attachment_url, created_at
        from class_posts
        order by created_at desc
      ` as Promise<Row[]>,
      sql`
        select id, post_id, author_name, initials, content, created_at
        from class_comments
        order by created_at asc
      ` as Promise<Row[]>,
      sql`
        select id, class_id, title, instructions, topic, due_at, due_label, points,
               attachment_name, attachment_url
        from class_assignments
        order by due_at asc nulls last, created_at asc
      ` as Promise<Row[]>,
      sql`
        select cs.id, cs.assignment_id, s.name as student_name, cs.status, cs.submitted_at,
               cs.drive_url, cs.grade, cs.feedback
        from class_submissions cs
        join students s on s.id = cs.student_id
      ` as Promise<Row[]>,
    ]);

  const memberNameById = new Map(memberRows.map((m) => [text(m.student_id), text(m.name)]));

  const classes: ClassroomClass[] = classRows.map((row) => {
    const classId = text(row.id);
    const members = memberRows.filter((m) => text(m.class_id) === classId);
    const approved = members.filter((m) => Boolean(m.enrolled));
    const waiting = members.filter((m) => !m.enrolled);
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
      enrolled: approved.some((m) => text(m.name) === studentName),
      pending: waiting.some((m) => text(m.name) === studentName),
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
      comments: commentRows
        .filter((c) => text(c.post_id) === text(row.id))
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
      submissions: submissionRows
        .filter((s) => text(s.assignment_id) === assignmentId)
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

  void memberNameById;
  return { classes, posts, assignments };
}

/** GET /api/classroom?studentName=...&teacherName=... */
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
    const store = await loadStore(studentName, teacherName);
    return NextResponse.json({ store, source: "db" });
  } catch (error) {
    return NextResponse.json({ error: safeErrorMessage(error) }, { status: 500 });
  }
}

type ActionBody = {
  action: string;
  classId?: string;
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

/** POST /api/classroom — semua mutasi kelas digital */
export async function POST(request: NextRequest) {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;

  if (!dbConfigured()) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as ActionBody | null;
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
        const id = `class-${Date.now().toString(36)}`;
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
        if (!isStudent || !studentId || !body.classId) return deny();
        await sql`
          insert into class_members (class_id, student_id, enrolled, requested_at)
          values (${body.classId}, ${studentId}, ${false}, now())
          on conflict (class_id, student_id) do nothing
        `;
        return NextResponse.json({ ok: true, pending: true });
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
        if (!(await classOwnedByTeacher(body.classId))) return deny();
        const id = `post-${Date.now().toString(36)}`;
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
        const id = `c-${Date.now().toString(36)}`;
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
        if (!(await classOwnedByTeacher(body.classId))) return deny();
        const id = `asg-${Date.now().toString(36)}`;
        const dueTs = body.dueTs ?? Date.now() + 7 * 86400000;
        await sql`
          insert into class_assignments (
            id, class_id, title, instructions, topic, due_at, due_label, points,
            attachment_name, attachment_url
          ) values (
            ${id}, ${body.classId}, ${body.title}, ${body.instructions ?? ""}, ${body.topic || "Umum"},
            ${new Date(dueTs).toISOString()}, ${body.due || "Belum dijadwalkan"}, ${body.points ?? 100},
            ${body.attachmentName ?? null}, ${body.attachmentUrl ?? null}
          )
          on conflict (id) do nothing
        `;

        const members = (await sql`
          select cm.student_id
          from class_members cm
          where cm.class_id = ${body.classId}
        `) as Row[];
        const submissionRows = members.map((member) => ({
          id: `${id}-${text(member.student_id)}`,
          assignment_id: id,
          student_id: text(member.student_id),
          status: "assigned",
        }));
        if (submissionRows.length > 0) {
          await sql`
            insert into class_submissions (id, assignment_id, student_id, status)
            select x.id, x.assignment_id, x.student_id, x.status
            from jsonb_to_recordset(${JSON.stringify(submissionRows)}::jsonb) as x(
              id text, assignment_id text, student_id text, status text
            )
            on conflict (assignment_id, student_id) do nothing
          `;
        }
        return NextResponse.json({ ok: true, id });
      }

      case "submit": {
        const studentId = await getStudentId();
        if (!isStudent || !studentId || !body.assignmentId || !body.link) {
          throw new Error("Link Google Drive wajib diisi.");
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
        if (!body.assignmentId || !body.studentName) throw new Error("Data tidak lengkap.");
        const assignmentRows = (await sql`
          select class_id from class_assignments where id = ${body.assignmentId} limit 1
        `) as Row[];
        const classId = assignmentRows[0] ? text(assignmentRows[0].class_id) : null;
        if (!classId || !(await classOwnedByTeacher(classId))) return deny();

        const targetRows = (await sql`
          select s.id from students s
          join class_members cm on cm.student_id = s.id and cm.class_id = ${classId}
          where s.name = ${body.studentName}
          limit 1
        `) as Row[];
        const targetId = targetRows[0] ? text(targetRows[0].id) : null;
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
