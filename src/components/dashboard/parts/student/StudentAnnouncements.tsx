"use client";

import { AlertCircle, Check, CheckCheck, Inbox, Megaphone, Pin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudentAnnouncement } from "@/components/dashboard/parts/student/types";

type Filter = "semua" | "baru" | "penting";

type Props = {
  announcements: StudentAnnouncement[];
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
};

export default function StudentAnnouncements({
  announcements,
  filter,
  onFilterChange,
  onMarkRead,
  onMarkAllRead,
}: Props) {
  const unreadCount = announcements.filter((a) => !a.read).length;
  const urgentCount = announcements.filter((a) => a.isUrgent).length;
  const visible = announcements.filter((a) =>
    filter === "baru" ? !a.read : filter === "penting" ? a.isUrgent : true
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-brand-green">
            <Megaphone size={15} aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Pusat Informasi</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mt-1">
            Pengumuman Siswa
          </h1>
          <p className="text-muted text-sm">Informasi penting terkait akademik dan kesiswaan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1.5 text-[11px] font-semibold text-ink shadow-sm">
            <Inbox size={12} className="text-brand-green" aria-hidden="true" />
            {announcements.length} pengumuman
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm",
              unreadCount > 0
                ? "bg-brand-green/10 border-brand-leaf/30 text-brand-green"
                : "bg-white border-line text-muted"
            )}
          >
            {unreadCount} belum dibaca
          </span>
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-tint border border-danger px-3 py-1.5 text-[11px] font-semibold text-danger-deep shadow-sm">
              <AlertCircle size={12} aria-hidden="true" />
              {urgentCount} mendesak
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex gap-2" role="group" aria-label="Filter pengumuman">
          {(
            [
              { id: "semua", label: "Semua" },
              { id: "baru", label: `Belum Dibaca${unreadCount ? ` (${unreadCount})` : ""}` },
              { id: "penting", label: "Mendesak" },
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
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:text-brand-pine"
          >
            <CheckCheck size={14} aria-hidden="true" />
            Tandai semua dibaca
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-line">
          <div className="w-14 h-14 rounded-2xl bg-cream border border-line flex items-center justify-center mx-auto mb-4">
            <Inbox size={24} className="text-muted" aria-hidden="true" />
          </div>
          <div className="font-semibold text-ink">Tidak ada pengumuman di filter ini</div>
          <div className="text-muted text-sm mt-1">Coba pilih filter lain atau cek kembali nanti.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((ann) => (
            <article
              key={ann.id}
              className={cn(
                "card relative overflow-hidden p-5 transition-colors duration-200 ease-out",
                !ann.read && "border-brand-leaf/40 bg-gradient-to-r from-brand-green/[0.05] via-white to-white"
              )}
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 w-1",
                  ann.isUrgent ? "bg-danger-deep" : ann.isPinned ? "bg-brand-lime" : "bg-brand-green/40"
                )}
                aria-hidden="true"
              />
              <div className="flex gap-4">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                    ann.isUrgent
                      ? "bg-danger-tint text-danger-deep"
                      : ann.isPinned
                        ? "bg-brand-lime/25 text-brand-pine"
                        : "bg-brand-green/10 text-brand-green"
                  )}
                  aria-hidden="true"
                >
                  {ann.isUrgent ? (
                    <AlertCircle size={20} />
                  ) : ann.isPinned ? (
                    <Pin size={20} />
                  ) : (
                    <Megaphone size={20} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {ann.isUrgent && (
                      <span className="badge bg-danger-tint text-danger-deep text-[10px] font-bold">Mendesak</span>
                    )}
                    {ann.isPinned && (
                      <span className="badge bg-brand-lime/25 text-brand-pine text-[10px] font-bold inline-flex items-center gap-1">
                        <Pin size={10} aria-hidden="true" /> Disematkan
                      </span>
                    )}
                    {!ann.read && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-brand-green">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"
                          aria-hidden="true"
                        />
                        Baru
                      </span>
                    )}
                    <span className="text-[11px] text-muted sm:ml-auto">{ann.time}</span>
                  </div>
                  <h3 className="font-display font-bold text-ink text-base leading-snug">{ann.title}</h3>
                  {ann.body && (
                    <p className="text-xs sm:text-sm text-muted leading-relaxed mt-1.5 line-clamp-3">
                      {ann.body}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3 border-t border-line">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                      <User size={12} aria-hidden="true" />
                      {ann.author || "Tata Usaha"}
                    </span>
                    {ann.read ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                        <Check size={13} aria-hidden="true" /> Terbaca
                      </span>
                    ) : (
                      <button
                        onClick={() => onMarkRead(ann.id)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 text-brand-green text-[11px] font-bold px-3 py-1.5 hover:bg-brand-green hover:text-white transition-colors"
                      >
                        <Check size={13} aria-hidden="true" /> Tandai dibaca
                      </button>
                    )}
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
