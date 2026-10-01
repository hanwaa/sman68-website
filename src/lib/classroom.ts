
export type ClassroomRole = "student" | "teacher";

export interface ClassRequest {
  id: string;
  name: string;
  initials: string;
  time: string;
}

export interface ClassroomClass {
  id: string;
  name: string;
  section: string;
  subject: string;
  room: string;
  code: string;
  teacher: string;
  teacherInitials: string;
  color: string;
  description: string;
  enrolled: boolean;
  pending: boolean;
  teacherOwned: boolean;
  students: string[];
  requests: ClassRequest[];
}

export interface ClassComment {
  id: string;
  author: string;
  initials: string;
  time: string;
  text: string;
}

export interface ClassAttachment {
  name: string;
  url: string;
  type: "file" | "drive";
}

export interface ClassPost {
  id: string;
  classId: string;
  author: string;
  initials: string;
  time: string;
  content: string;
  kind: "announcement" | "material";
  attachment?: ClassAttachment;
  comments: ClassComment[];
}

export type SubmissionStatus = "assigned" | "turned_in" | "graded";

export interface ClassSubmission {
  student: string;
  initials: string;
  status: SubmissionStatus;
  submittedAt?: string;
  link?: string;
  grade?: number;
  feedback?: string;
}

export interface ClassAssignment {
  id: string;
  classId: string;
  title: string;
  instructions: string;
  topic: string;
  due: string;
  dueTs: number;
  points: number;
  attachment?: ClassAttachment;
  submissions: ClassSubmission[];
}

export interface ClassroomStore {
  classes: ClassroomClass[];
  posts: ClassPost[];
  assignments: ClassAssignment[];
}

export function classInitials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z\s]/g, " ")
    .trim()
    .split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export type ClassroomActionResult = {
  ok: boolean;
  id?: string;
  code?: string;
  error?: string;
};

/** Muat seluruh store kelas dari database (identitas dari sesi, tanpa data seed). */
export async function apiFetchClassroomStore(
  role: ClassroomRole,
  userName: string
): Promise<ClassroomStore | null> {
  void role;
  void userName;
  try {
    const res = await fetch("/api/classroom", { cache: "no-store" });
    if (!res.ok) return null;
    const payload = (await res.json()) as { store?: ClassroomStore };
    return payload.store ?? null;
  } catch {
    return null;
  }
}

/** Kirim mutasi kelas ke database. */
export async function apiClassroomAction(
  payload: Record<string, unknown>
): Promise<ClassroomActionResult> {
  try {
    const res = await fetch("/api/classroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as ClassroomActionResult | null;
    if (!res.ok) return { ok: false, error: data?.error ?? "Gagal menyimpan." };
    return { ok: true, id: data?.id, code: data?.code };
  } catch {
    return { ok: false, error: "Tidak dapat menghubungi server." };
  }
}

export function classesFor(store: ClassroomStore, role: ClassroomRole): ClassroomClass[] {
  return store.classes.filter((c) => (role === "teacher" ? c.teacherOwned : c.enrolled));
}

export function assignmentsFor(store: ClassroomStore, classId: string): ClassAssignment[] {
  return store.assignments
    .filter((a) => a.classId === classId)
    .sort((a, b) => a.dueTs - b.dueTs);
}

export function postsFor(store: ClassroomStore, classId: string): ClassPost[] {
  return store.posts.filter((p) => p.classId === classId);
}

export function submissionOf(
  assignment: ClassAssignment,
  studentName: string
): ClassSubmission | undefined {
  return assignment.submissions.find((s) => s.student === studentName);
}
