"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, LogIn, User } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next") || "";
  const nextPath = requestedNext.startsWith("/") ? requestedNext : "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bila sudah punya sesi valid, langsung lanjut ke dashboard.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => {
        // Navigasi keras: buang seluruh Router Cache milik akun sebelumnya.
        if (res.ok && !cancelled) window.location.replace(nextPath);
      })
      .catch(() => {
        /* belum login — tetap tampilkan form */
      });
    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          remember: rememberMe,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setError(payload?.error ?? "Gagal masuk. Coba lagi.");
        setLoading(false);
        return;
      }

      // Navigasi keras agar dashboard dirender dari sesi baru (bukan cache akun lama).
      window.location.assign(nextPath);
    } catch {
      setError("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-between font-body text-ink">
      {/* Simple Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand-green transition-colors"
        >
          <ArrowLeft size={14} /> Beranda
        </Link>
        <span className="text-[11px] font-semibold text-muted">SMAN 68 Jakarta</span>
      </header>

      {/* Centered Login Box */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white rounded-xl p-6 sm:p-8 shadow-card border border-line"
        >
          {/* Logo & Brand Title */}
          <div className="text-center mb-6">
            <Link
              href="/"
              className="inline-block relative w-12 h-12 mb-3 hover:scale-105 transition-transform"
            >
              <Image
                src="/assets/logo.png"
                alt="Logo SMAN 68 Jakarta"
                fill
                className="object-contain"
                sizes="48px"
              />
            </Link>
            <h1 className="font-display font-extrabold text-2xl text-brand-pine tracking-tight">
              Masuk ke SMAN 68 Jakarta
            </h1>
            <p className="text-muted text-xs mt-1">Portal terpadu SMA Negeri 68 Jakarta</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-ink mb-1">
                NISN / NIP / NPSN
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Contoh: 0068100101"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-cream/40"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-ink mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Password akun"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-line text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green bg-cream/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-icon absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 text-[11px] text-danger-deep bg-danger-tint border border-danger rounded-lg px-3 py-2"
              >
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                {error}
              </p>
            )}

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-muted select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-brand-green focus:ring-brand-green w-3.5 h-3.5"
                />
                Ingat saya
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs sm:text-sm disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={15} />
              )}
              Masuk
            </button>
          </form>

          <p className="mt-5 text-[11px] leading-relaxed text-muted bg-brand-mist border border-brand-leaf/20 rounded-lg px-3 py-2">
            Siswa masuk dengan <strong className="text-ink">NISN</strong>, guru dengan{" "}
            <strong className="text-ink">NIP</strong>, admin dengan{" "}
            <strong className="text-ink">NPSN</strong> sekolah. Password awal sama dengan nomor
            induk. Segera hubungi Tata Usaha bila lupa atau butuh bantuan.
          </p>
        </motion.div>
      </main>

      {/* Simple Footer */}
      <footer className="py-4 text-center text-[11px] text-muted">
        © {new Date().getFullYear()} SMAN 68 Jakarta
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center text-sm font-semibold text-muted">
          Memuat halaman masuk...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
