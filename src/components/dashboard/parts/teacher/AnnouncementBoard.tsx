"use client";

import { AlertCircle, Bell, Inbox, Megaphone, Pin, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeacherAnnouncement } from "@/components/dashboard/parts/teacher/types";

type Filter = "semua" | "penting" | "saya";

type Props = {
  announcements: TeacherAnnouncement[];
  userName: string;
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
  onCreate: () => void;
};

export default function AnnouncementBoard({
  announcements,
  userName,
  filter,
  onFilterChange,
  onCreate,
}: Props) {
  const urgentCount = announcements.filter((a) => a.urgent).length;
  const mineCount = announcements.filter((a) => a.author === userName).length;
  const visible = announcements.filter((a) =>
    filter === "penting" ? a.urgent : filter === "saya" ? a.author === userName : true
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-brand-green">
            <Megaphone size={15} aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Papan Pengumuman</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mt-1">
            Pengumuman Guru &amp; Staf
          </h1>
          <p className="text-muted text-sm">Kelola dan terbitkan instruksi kepada siswa</p>
        </div>
        <button
          onClick={onCreate}
          className="btn-primary text-xs px-4 py-2.5 self-start sm:self-auto"
        >
          <Plus size={15} /> Buat Pengumuman
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Pengumuman", value: announcements.length, icon: Bell, tone: "bg-brand-green/10 text-brand-green" },
          { label: "Mendesak", value: urgentCount, icon: AlertCircle, tone: "bg-red-100 text-red-600" },
          { label: "Terbitan Saya", value: mineCount, icon: User, tone: "bg-brand-lime/25 text-brand-pine" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <span
                className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", s.tone)}
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>
              <div>
                <div className="font-display font-extrabold text-xl text-ink leading-none">{s.value}</div>
                <div className="text-[11px] text-muted mt-1 font-medium">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mb-4" role="group" aria-label="Filter pengumuman">
        {(
          [
            { id: "semua", label: "Semua" },
            { id: "penting", label: `Mendesak${urgentCount ? ` (${urgentCount})` : ""}` },
            { id: "saya", label: "Terbitan Saya" },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            aria-pressed={filter === f.id}
            className={cn("chip", filter === f.id && "chip-active")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-line">
          <div className="w-14 h-14 rounded-2xl bg-cream border border-line flex items-center justify-center mx-auto mb-4">
            <Inbox size={24} className="text-muted" aria-hidden="true" />
          </div>
          <div className="font-semibold text-ink">Belum ada pengumuman di filter ini</div>
          <div className="text-muted text-sm mt-1">Terbitkan pengumuman lewat tombol Buat Pengumuman.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((ann) => (
            <article
              key={ann.id}
              className={cn(
                "card relative overflow-hidden p-5 transition-all",
                ann.urgent && "border-red-200 bg-gradient-to-r from-red-50/60 via-white to-white"
              )}
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 w-1",
                  ann.urgent ? "bg-red-500" : ann.pinned ? "bg-brand-lime" : "bg-brand-green/40"
                )}
                aria-hidden="true"
              />
              <div className="flex gap-4">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-extrabold text-xs",
                    ann.urgent ? "bg-red-100 text-red-600" : "bg-brand-pine text-brand-lime"
                  )}
                  aria-hidden="true"
                >
                  {(ann.author || "Admin")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase() || "AD"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {ann.urgent && (
                      <span className="badge bg-red-100 text-red-700 text-[10px] font-bold">Penting</span>
                    )}
                    {ann.pinned && (
                      <span className="badge bg-brand-lime/25 text-brand-pine text-[10px] font-bold inline-flex items-center gap-1">
                        <Pin size={10} aria-hidden="true" /> Disematkan
                      </span>
                    )}
                    <span className="badge bg-brand-green/10 text-brand-green text-[10px] font-semibold">
                      {ann.audience === "all" ? "Semua" : ann.audience === "teacher" ? "Guru" : "Siswa"}
                    </span>
                    <span className="text-[11px] text-muted sm:ml-auto">{ann.time}</span>
                  </div>
                  <h3 className="font-display font-bold text-ink text-base leading-snug">{ann.title}</h3>
                  {ann.body && (
                    <p className="text-xs sm:text-sm text-muted leading-relaxed mt-1.5 line-clamp-3">
                      {ann.body}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-line text-[11px] text-muted">
                    <User size={12} aria-hidden="true" />
                    <span className="font-semibold text-ink/70">{ann.author || "Admin"}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
