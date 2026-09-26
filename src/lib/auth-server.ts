import "server-only";
import { cookies } from "next/headers";
import { dbConfigured, getDb } from "@/lib/db";
import {
  SESSION_COOKIE,
  type AccountRole,
  type SessionAccount,
} from "@/lib/auth";

type Row = Record<string, unknown>;

/** Ambil akun dari cookie sesi; null bila tidak ada/tidak valid. */
export async function getSessionAccount(): Promise<SessionAccount | null> {
  if (!dbConfigured()) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const sql = getDb();
    const rows = (await sql`
      select a.id, a.username, a.role, a.name, a.detail,
             a.student_id, a.teacher_id,
             st.class_name as student_class,
             h.name as homeroom_name,
             (s.last_seen_at < now() - interval '2 minutes') as stale
      from auth_sessions s
      join accounts a on a.id = s.account_id
      left join students st on st.id = a.student_id
      left join homeroom_classes h on h.teacher_id = a.teacher_id
      where s.token = ${token} and s.expires_at > now() and a.status = 'Aktif'
      limit 1
    `) as Row[];

    const row = rows[0];
    if (!row) return null;

    // Tandai aktivitas terakhir (dibatasi 1x/2 menit agar tidak membebani DB).
    if (row.stale) {
      await sql`
        update auth_sessions set last_seen_at = now()
        where token = ${token} and last_seen_at < now() - interval '2 minutes'
      `;
    }

    const studentClass = row.student_class == null ? null : String(row.student_class);
    const homeroomName = row.homeroom_name == null ? null : String(row.homeroom_name);

    return {
      id: String(row.id),
      username: String(row.username),
      role: String(row.role) as AccountRole,
      name: String(row.name),
      detail: row.detail == null ? null : String(row.detail),
      studentId: row.student_id == null ? null : String(row.student_id),
      teacherId: row.teacher_id == null ? null : String(row.teacher_id),
      className: studentClass ?? homeroomName,
    };
  } catch {
    return null;
  }
}

export async function createSession(
  accountId: string,
  ttlSeconds: number,
  token: string
): Promise<void> {
  const sql = getDb();
  // Satu round-trip: bersihkan sesi kedaluwarsa + insert sesi baru.
  await sql`
    with cleanup as (
      delete from auth_sessions where expires_at < now()
    )
    insert into auth_sessions (token, account_id, expires_at)
    values (${token}, ${accountId}, now() + make_interval(secs => ${ttlSeconds}))
  `;
}

export async function destroySession(token: string): Promise<void> {
  if (!dbConfigured()) return;
  const sql = getDb();
  await sql`delete from auth_sessions where token = ${token}`;
}
