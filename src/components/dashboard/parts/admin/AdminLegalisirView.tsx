"use client";

import { useCallback, useEffect, useState } from "react";
import { Stamp, Power, Check, X, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LegalisirRequest } from "@/lib/legalisir";

type Props = {
  onShowToast?: (msg: string) => void;
};

export default function AdminLegalisirView({ onShowToast = () => {} }: Props) {
  const [open, setOpen] = useState(true);
  const [requests, setRequests] = useState<LegalisirRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/legalisir", { cache: "no-store" });
      if (!res.ok) return;
      const payload = (await res.json()) as { open?: boolean; requests?: LegalisirRequest[] };
      setOpen(payload.open !== false);
      setRequests(payload.requests ?? []);
    } catch {
      /* abaikan */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/legalisir", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", open: !open }),
      });
      const payload = (await res.json().catch(() => null)) as { open?: boolean; error?: string } | null;
      if (!res.ok) {
        onShowToast(payload?.error ?? "Gagal mengubah status layanan.");
        return;
      }
      setOpen(payload?.open !== false);
      onShowToast(payload?.open !== false ? "Layanan legalisir DIBUKA untuk kelas 12." : "Layanan legalisir DITUTUP.");
    } catch {
      onShowToast("Server tidak terjangkau.");
    } finally {
      setToggling(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    const note = status === "rejected" ? window.prompt("Alasan penolakan (opsional):") ?? "" : "";
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as LegalisirRequest["status"], note } : r)));
    try {
      await fetch("/api/legalisir", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", id, status, note }),
      });
      onShowToast(`Pengajuan ${status}.`);
    } catch {
      onShowToast("Gagal menyimpan, server tidak terjangkau.");
    }
  };

  const pending = requests.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink flex items-center gap-2">
          <Stamp size={24} className="text-brand-green" /> Legalisir Ijazah
        </h1>
        <p className="text-muted text-sm mt-1">
          Khusus siswa kelas 12 · {pending} menunggu verifikasi · Layanan hanya dibuka oleh admin.
        </p>
      </div>

      <div className={cn("card p-5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3", open ? "border-brand-leaf/40" : "border-danger/40")}>
        <div>
          <div className="font-bold text-ink text-sm">
            Status layanan: {loaded ? (open ? "DIBUKA" : "DITUTUP") : "…"}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {open
              ? "Siswa kelas 12 dapat mengajukan legalisir sekarang."
              : "Siswa melihat pesan layanan ditutup dan tidak bisa mengajukan."}
          </div>
        </div>
        <button onClick={toggle} disabled={toggling || !loaded} className={open ? "btn-danger text-xs" : "btn-primary text-xs"}>
          <Power size={14} /> {toggling ? "Menyimpan…" : open ? "Tutup Layanan" : "Buka Layanan"}
        </button>
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-ink text-sm mb-3">Daftar Pengajuan ({requests.length})</h2>
        {requests.length === 0 ? (
          <div className="text-sm text-muted py-6 text-center">Belum ada pengajuan legalisir.</div>
        ) : (
          <div className="divide-y divide-line">
            {requests.map((r) => (
              <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-ink text-sm">
                    {r.studentName} · {r.className ?? "-"} · {r.sheets} lembar
                  </div>
                  <div className="text-xs text-muted mt-0.5">{r.purpose}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    {" · "}{r.status}{r.note ? `, ${r.note}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => setStatus(r.id, "approved")} className="btn-ghost text-xs gap-1"><Check size={13} /> Setujui</button>
                      <button onClick={() => setStatus(r.id, "rejected")} className="btn-danger text-xs gap-1"><X size={13} /> Tolak</button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <button onClick={() => setStatus(r.id, "done")} className="btn-ghost text-xs gap-1"><PackageCheck size={13} /> Tandai selesai</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
