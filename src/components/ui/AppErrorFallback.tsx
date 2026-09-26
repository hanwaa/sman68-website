"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

type AppErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const CHUNK_ERROR_PATTERN = /chunk|dynamically imported module|failed to fetch|loading .* failed/i;
const RELOAD_FLAG = "sman68_error_reload_at";
const RELOAD_COOLDOWN_MS = 30_000;

export default function AppErrorFallback({ error, reset }: AppErrorFallbackProps) {
  useEffect(() => {
    const message = `${error?.name ?? ""} ${error?.message ?? ""}`;
    if (!CHUNK_ERROR_PATTERN.test(message)) return;

    try {
      const lastReload = Number(sessionStorage.getItem(RELOAD_FLAG) ?? 0);
      if (Date.now() - lastReload < RELOAD_COOLDOWN_MS) return;
      sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
    } catch {
      /* lanjut muat ulang */
    }
    window.location.reload();
  }, [error]);

  const clearFlag = () => {
    try {
      sessionStorage.removeItem(RELOAD_FLAG);
    } catch {
      /* abaikan */
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <AlertCircle size={24} className="text-red-600" aria-hidden="true" />
        </div>
        <h1 className="font-display text-xl font-extrabold text-ink">Halaman gagal dimuat</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Biasanya ini karena versi lama masih tersimpan di browser setelah situs diperbarui.
          Muat ulang untuk mengambil versi terbaru.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            onClick={() => {
              clearFlag();
              reset();
            }}
            className="btn-outline text-sm"
          >
            Coba lagi
          </button>
          <button
            onClick={() => {
              clearFlag();
              window.location.reload();
            }}
            className="btn-primary text-sm"
          >
            <RefreshCw size={14} aria-hidden="true" /> Muat ulang
          </button>
        </div>
      </div>
    </div>
  );
}
