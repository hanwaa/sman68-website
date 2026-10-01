"use client";

import { useCallback, useEffect, useState } from "react";
import { Stamp, Lock, Send, Info } from "lucide-react";
import { isGrade12, type LegalisirRequest } from "@/lib/legalisir";

type Props = {
  className?: string;
  onShowToast?: (msg: string) => void;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu verifikasi TU",
  approved: "Disetujui, siap diambil di TU",
  rejected: "Ditolak",
  done: "Selesai",
};

export default function LegalisirView({ className, onShowToast = () => {} }: Props) {
  const grade12 = isGrade12(className);
  const [open, setOpen] = useState(true);
  const [mine, setMine] = useState<LegalisirRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sheets, setSheets] = useState(3);
  const [purpose, setPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/legalisir", { cache: "no-store" });
      if (!res.ok) return;
      const payload = (await res.json()) as {
        open?: boolean;
        mine?: LegalisirRequest[];
      };
      setOpen(payload.open !== false);
      setMine(payload.mine ?? []);
    } catch {
      /* biarkan state awal */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      onShowToast("Isi keperluan legalisir terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/legalisir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheets, purpose: purpose.trim() }),
      });
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        data?: LegalisirRequest;
      } | null;
      if (!res.ok) {
        onShowToast(payload?.error ?? "Gagal mengajukan legalisir.");
        return;
      }
      if (payload?.data) setMine((prev) => [payload.data as LegalisirRequest, ...prev]);
      setPurpose("");
      onShowToast("Pengajuan legalisir terkirim. Pantau status di bawah.");
    } catch {
      onShowToast("Server tidak terjangkau.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!grade12) {
    return (
      <div className="card p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center mx-auto mb-3">
          <Info size={22} className="text-brand-green" />
        </div>
        <h1 className="font-display font-extrabold text-xl text-ink">Legalisir Ijazah</h1>
        <p className="text-sm text-muted mt-2 max-w-md mx-auto leading-relaxed">
          Layanan ini khusus untuk siswa <strong className="text-ink">kelas 12</strong>. Kamu tercatat
          di kelas <strong className="text-ink">{className ?? "-"}</strong>, jadi menu pengajuan
          belum tersedia. Hubungi Tata Usaha bila ada kebutuhan surat keterangan.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink flex items-center gap-2">
          <Stamp size={24} className="text-brand-green" /> Legalisir Ijazah
        </h1>
        <p className="text-muted text-sm mt-1">
          Khusus kelas 12 · Kelas {className} · Pengajuan hanya diproses saat layanan dibuka admin/TU.
        </p>
      </div>

      {!loaded ? (
        <div className="card p-6 text-sm text-muted">Memuat status layanan…</div>
      ) : !open ? (
        <div className="card p-6 text-center border-danger/40">
          <div className="w-12 h-12 rounded-2xl bg-danger-tint flex items-center justify-center mx-auto mb-3">
            <Lock size={22} className="text-danger-deep" />
          </div>
          <div className="font-bold text-ink">Layanan sedang ditutup</div>
          <p className="text-sm text-muted mt-1">
            Admin/TU belum membuka layanan legalisir. Silakan cek berkala atau hubungi TU di
            (021) 3142929.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="card p-5 mb-4">
          <h2 className="font-bold text-ink text-sm mb-3">Form Pengajuan Baru</h2>
          <div className="grid sm:grid-cols-[140px_1fr] gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted">Jumlah lembar</span>
              <select
                value={sheets}
                onChange={(e) => setSheets(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm"
              >
                {[1, 2, 3, 5, 10].map((n) => (
                  <option key={n} value={n}>{n} lembar</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted">Keperluan</span>
              <input
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="cth: Pendaftaran SNBP, Universitas Indonesia"
                maxLength={500}
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </label>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary mt-4 disabled:opacity-60">
            <Send size={14} /> {submitting ? "Mengirim…" : "Ajukan Legalisir"}
          </button>
          <p className="text-[11px] text-muted mt-2">
            Bawa ijazah/transkrip asli saat pengambilan di TU. Legalisir diproses maksimal 3 hari kerja
            setelah disetujui.
          </p>
        </form>
      )}

      <div className="card p-5">
        <h2 className="font-bold text-ink text-sm mb-3">Riwayat Pengajuan Saya ({mine.length})</h2>
        {mine.length === 0 ? (
          <div className="text-sm text-muted py-6 text-center">Belum ada pengajuan.</div>
        ) : (
          <div className="divide-y divide-line">
            {mine.map((r) => (
              <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-ink text-sm">{r.sheets} lembar, {r.purpose}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}
                    <span className="font-semibold">{STATUS_LABEL[r.status] ?? r.status}</span>
                    {r.note ? `, ${r.note}` : ""}
                  </div>
                </div>
                <span className="badge bg-brand-green/10 text-brand-green text-[10px] self-start sm:self-auto">{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
