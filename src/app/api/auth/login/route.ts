import { NextRequest, NextResponse } from "next/server";
import { dbConfigured, getDb } from "@/lib/db";
import {
  createSessionToken,
  hashPassword,
  LOGIN_LOCK_SECONDS,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_SECONDS,
  passwordNeedsRehash,
  REMEMBER_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  verifyPassword,
} from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { createSession } from "@/lib/auth-server";
import { isSameOrigin } from "@/lib/csrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Permintaan ditolak." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { username?: string; password?: string; remember?: boolean }
    | null;

  const username = payload?.username?.trim() ?? "";
  const password = payload?.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "NISN/NIP/NPSN dan password wajib diisi." },
      { status: 400 }
    );
  }

  if (!dbConfigured()) {
    return NextResponse.json(
      { error: "Database belum dikonfigurasi. Hubungi admin sekolah." },
      { status: 503 }
    );
  }

  try {
    const sql = getDb();

    // 1) Baca status lockout + akun sekaligus (paralel)
    const [attemptRows, accountRows] = await Promise.all([
      sql`
        select failed_count, first_failed_at, locked_until,
               extract(epoch from (now() - first_failed_at))::int as window_age
        from auth_login_attempts
        where username = ${username}
        limit 1
      ` as Promise<Row[]>,
      sql`
        select id, username, password_hash, role, name, detail, status
        from accounts where username = ${username} limit 1
      ` as Promise<Row[]>,
    ]);

    const attempt = attemptRows[0];
    if (attempt?.locked_until) {
      const lockedUntil = new Date(String(attempt.locked_until)).getTime();
      if (lockedUntil > Date.now()) {
        const retryAfter = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));
        return NextResponse.json(
          {
            error: `Terlalu banyak percobaan masuk. Coba lagi dalam ${Math.ceil(
              retryAfter / 60
            )} menit.`,
          },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }
    }

    // 2) Validasi kredensial (pesan seragam agar tidak membocorkan status akun)
    const account = accountRows[0];
    const validCredentials =
      Boolean(account) &&
      String(account?.status) === "Aktif" &&
      (await verifyPassword(password, String(account?.password_hash)));

    if (!account || !validCredentials) {
      const windowAge = attempt ? Number(attempt.window_age) : null;
      const sameWindow = windowAge !== null && windowAge <= LOGIN_WINDOW_SECONDS;
      const failedCount = sameWindow ? Number(attempt?.failed_count ?? 0) + 1 : 1;
      const shouldLock = failedCount >= LOGIN_MAX_ATTEMPTS;

      await sql`
        insert into auth_login_attempts (
          username, failed_count, first_failed_at, last_attempt_at, locked_until
        ) values (
          ${username}, ${failedCount}, now(), now(),
          ${shouldLock ? new Date(Date.now() + LOGIN_LOCK_SECONDS * 1000).toISOString() : null}
        )
        on conflict (username) do update set
          failed_count = excluded.failed_count,
          first_failed_at = case
            when auth_login_attempts.first_failed_at < now() - make_interval(secs => ${LOGIN_WINDOW_SECONDS})
            then now() else auth_login_attempts.first_failed_at end,
          last_attempt_at = now(),
          locked_until = excluded.locked_until
      `;

      if (shouldLock) {
        return NextResponse.json(
          { error: "Terlalu banyak percobaan masuk. Akun dikunci sementara 15 menit." },
          { status: 429, headers: { "Retry-After": String(LOGIN_LOCK_SECONDS) } }
        );
      }
      return NextResponse.json(
        { error: "Nomor induk atau password salah." },
        { status: 401 }
      );
    }

    // 3) Login sukses: bersihkan counter, upgrade hash lama, buat sesi (paralel)
    const ttl = payload?.remember ? REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS;
    const token = createSessionToken();
    const rehash = passwordNeedsRehash(String(account.password_hash))
      ? (async () => {
          try {
            await sql`
              update accounts set password_hash = ${await hashPassword(password)} where id = ${account.id}
            `;
          } catch {
            /* rehash gagal tidak menghalangi login */
          }
        })()
      : Promise.resolve();

    await Promise.all([
      sql`delete from auth_login_attempts where username = ${username}`,
      rehash,
      createSession(String(account.id), ttl, token),
    ]);

    const response = NextResponse.json({
      ok: true,
      data: {
        role: String(account.role),
        name: String(account.name),
        detail: account.detail == null ? null : String(account.detail),
      },
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ttl,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Gagal masuk. Coba lagi." }, { status: 500 });
  }
}
