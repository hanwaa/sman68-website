import "server-only";
import { NextResponse } from "next/server";
import { getSessionAccount } from "@/lib/auth-server";
import type { AccountRole, SessionAccount } from "@/lib/auth";

/** Wajib login; mengembalikan akun sesi atau response 401. */
export async function requireAccount(): Promise<SessionAccount | NextResponse> {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json(
      { error: "Sesi tidak valid. Silakan masuk kembali." },
      { status: 401 }
    );
  }
  return account;
}

/** Wajib login dengan role tertentu; mengembalikan akun sesi atau response 401/403. */
export async function requireRole(
  roles: AccountRole[]
): Promise<SessionAccount | NextResponse> {
  const account = await requireAccount();
  if (account instanceof NextResponse) return account;
  if (!roles.includes(account.role)) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }
  return account;
}

/** Pesan error aman: jangan bocorkan detail error database ke client. */
export function safeErrorMessage(error: unknown): string {
  const isDatabaseError =
    typeof error === "object" && error !== null && "code" in (error as Record<string, unknown>);
  if (isDatabaseError) return "Terjadi kesalahan pada server.";
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}
