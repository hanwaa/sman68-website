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
  verifyDummyPassword,
  verifyPassword,
} from "@/lib/auth";
import { LEGACY_SESSION_COOKIE, SESSION_COOKIE } from "@/lib/auth-constants";
import { createSession } from "@/lib/auth-server";
import { guardMutation, readJsonLimited, MemoryThrottle, clientIp } from "@/lib/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Throttle per IP: lapis tambahan di atas lockout per-username.
// Bisa dilonggarkan via env saat window lomba (default 30/menit, normal).
// Catatan: throttle ini in-memory per proses PM2, cluster 2 instance ≈ 2× nilai env.
const LOGIN_IP_LIMIT_PER_MIN = Number(process.env.LOGIN_IP_LIMIT_PER_MIN ?? 30);
const loginIpThrottle = new MemoryThrottle(
  2000,
  Number.isFinite(LOGIN_IP_LIMIT_PER_MIN) && LOGIN_IP_LIMIT_PER_MIN > 0
    ? Math.trunc(LOGIN_IP_LIMIT_PER_MIN)
    : 30,
  60_000
);

type Row = Record<string, unknown>;

export async function POST(request: NextRequest) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;

  const ipThrottle = loginIpThrottle.take(`login:${clientIp(request)}`);
  if (!ipThrottle.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan masuk. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(ipThrottle.retryAfter) } }
    );
  }

  const payload = (await readJsonLimited<{
    username?: string;
    password?: string;
    remember?: boolean;
  }>(request)) as { username?: string; password?: string; remember?: boolean } | null;

  const username = (payload?.username?.trim() ?? "").slice(0, 64);
  const password = (payload?.password ?? "").slice(0, 128);

  if (!username || !password) {
    return NextResponse.json(
      { error: "NISN/NIP/NPSN dan password wajib diisi." },
      { status: 400 }
    );
  }
  if (username.length < 3) {
    return NextResponse.json(
      { error: "Nomor induk atau password salah." },
      { status: 401 }
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

    // 2) Validasi kredensial (pesan seragam agar tidak membocorkan status akun).
    // Selalu jalankan scrypt (asli atau dummy) agar timing respons seragam
    // dan penyerang tidak bisa membedakan username valid via timing.
    const account = accountRows[0];
    const active = account && String(account?.status) === "Aktif";
    const passwordOk = active
      ? await verifyPassword(password, String(account?.password_hash))
      : await verifyDummyPassword().then(() => false);
    const validCredentials = Boolean(active) && passwordOk;

    if (!account || !validCredentials) {
      // Upsert ATOMIK single-statement: hitung + kunci dalam satu query agar
      // N request gagal yang datang bersamaan masing-masing terhitung (sebelumnya
      // read-di-JS lalu write → puluhan request paralel hanya terhitung ~1 dan
      // lockout bisa dilewati). Mengembalikan counter pasca-increment.
      const counted = (await sql`
        insert into auth_login_attempts (
          username, failed_count, first_failed_at, last_attempt_at, locked_until
        ) values (
          ${username}, 1, now(), now(), null
        )
        on conflict (username) do update set
          failed_count = case
            when auth_login_attempts.first_failed_at < now() - make_interval(secs => ${LOGIN_WINDOW_SECONDS})
            then 1 else auth_login_attempts.failed_count + 1 end,
          first_failed_at = case
            when auth_login_attempts.first_failed_at < now() - make_interval(secs => ${LOGIN_WINDOW_SECONDS})
            then now() else auth_login_attempts.first_failed_at end,
          last_attempt_at = now(),
          locked_until = case
            when (case
              when auth_login_attempts.first_failed_at < now() - make_interval(secs => ${LOGIN_WINDOW_SECONDS})
              then 1 else auth_login_attempts.failed_count + 1 end) >= ${LOGIN_MAX_ATTEMPTS}
            then now() + make_interval(secs => ${LOGIN_LOCK_SECONDS})
            else null end
        returning failed_count
      `) as Row[];

      const shouldLock = Number(counted[0]?.failed_count ?? 1) >= LOGIN_MAX_ATTEMPTS;

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
    // Cookie __Host- butuh Secure (https/prod). Di dev http (localhost),
    // pakai nama legacy agar login lokal tetap berfungsi; server membaca keduanya.
    const isSecure =
      process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:";
    response.cookies.set(isSecure ? SESSION_COOKIE : LEGACY_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      path: "/",
      maxAge: ttl,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Gagal masuk. Coba lagi." }, { status: 500 });
  }
}
