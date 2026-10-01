import {
  createHash,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";

export { SESSION_COOKIE, LEGACY_SESSION_COOKIE } from "@/lib/auth-constants";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
export const REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 30;

// Brute-force protection
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_SECONDS = 15 * 60;
export const LOGIN_LOCK_SECONDS = 15 * 60;

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 } as const;

export type AccountRole = "student" | "teacher" | "admin";

export type SessionAccount = {
  id: string;
  username: string;
  role: AccountRole;
  name: string;
  detail: string | null;
  studentId: string | null;
  teacherId: string | null;
  className: string | null;
};

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS, (error, derivedKey) =>
      error ? reject(error) : resolve(derivedKey)
    );
  });
}

/** Simpan password sebagai scrypt + salt per akun (password awal = nomor induk). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const digest = (await scryptAsync(password, salt)).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

/** Kompatibel dengan hash lama `sha256$salt$hash` agar akun existing tetap bisa masuk. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, digest] = stored.split("$");
  if (!salt || !digest) return false;

  if (scheme === "scrypt") {
    const candidate = (await scryptAsync(password, salt)).toString("hex");
    return safeEqualHex(candidate, digest);
  }

  if (scheme === "sha256") {
    const candidate = createHash("sha256").update(`${salt}:${password}`).digest("hex");
    return safeEqualHex(candidate, digest);
  }

  return false;
}

/** Hash lama (sha256) perlu di-upgrade ke scrypt setelah login sukses. */
export function passwordNeedsRehash(stored: string): boolean {
  return !stored.startsWith("scrypt$");
}

/**
 * Verifikasi dummy dengan biaya setara scrypt, dipakai saat akun tidak
 * ditemukan/nonaktif agar timing respons login seragam (anti-enumerasi).
 * Salt tetap agar tidak ada jalan pintas timing.
 */
export async function verifyDummyPassword(): Promise<void> {
  await scryptAsync("dummy-password-for-timing", "0".repeat(32));
}

function safeEqualHex(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "hex");
  const bufferB = Buffer.from(b, "hex");
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}
