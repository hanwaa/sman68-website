"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOTIF_META, type DashboardNotification } from "@/components/dashboard/dashboard-nav";

type Props = {
  open: boolean;
  notifications: DashboardNotification[];
  readIds: string[];
  unreadCount: number;
  loaded: boolean;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClose: () => void;
};

export default function NotificationPopover({
  open,
  notifications,
  readIds,
  unreadCount,
  loaded,
  onMarkAllRead,
  onClearAll,
  onMarkRead,
  onDismiss,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: "top right" }}
          className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2.5rem))] sm:w-96 bg-white rounded-xl shadow-card border border-line overflow-hidden z-50 text-ink"
        >
          <div className="p-3.5 bg-brand-pine text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-brand-leaf" />
              <span className="font-semibold text-sm">Pusat Notifikasi</span>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-[11px] text-brand-green hover:underline font-semibold"
                >
                  Tandai Dibaca
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="inline-flex items-center gap-1 text-[11px] text-white/70 hover:text-white font-semibold"
                >
                  <Trash2 size={11} aria-hidden="true" /> Hapus Semua
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-line max-h-72 overflow-y-auto">
            {!loaded ? (
              <div className="p-4 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-11 animate-pulse rounded-xl bg-line/60" aria-hidden="true" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-cream border border-line flex items-center justify-center mx-auto mb-2">
                  <Bell size={16} className="text-muted" aria-hidden="true" />
                </div>
                <div className="text-xs font-semibold text-ink">Belum ada notifikasi</div>
                <div className="text-[10px] text-muted mt-0.5">
                  Info baru akan muncul otomatis di sini.
                </div>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = NOTIF_META[n.kind] ?? NOTIF_META.pengumuman;
                const Icon = meta.icon;
                const unread = !readIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onMarkRead(n.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onMarkRead(n.id);
                      }
                    }}
                    className={cn(
                      "group relative w-full cursor-pointer p-3 pr-9 text-left text-xs transition-colors hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40",
                      unread && "bg-brand-green/5"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                          meta.tone
                        )}
                        aria-hidden="true"
                      >
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-ink leading-snug",
                            unread && "font-semibold"
                          )}
                        >
                          {n.title}
                        </span>
                        {n.detail && (
                          <span className="block text-[10px] text-muted mt-0.5 line-clamp-2">
                            {n.detail}
                          </span>
                        )}
                        <span className="block text-[10px] text-muted mt-1">{n.time}</span>
                      </span>
                      {unread && (
                        <span
                          className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0 mt-1.5"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(n.id);
                      }}
                      className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-md text-muted opacity-70 transition-colors hover:bg-danger-tint hover:text-danger-deep hover:opacity-100"
                      aria-label={`Hapus notifikasi: ${n.title}`}
                      title="Hapus notifikasi"
                    >
                      <X size={12} aria-hidden="true" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-2.5 bg-cream text-center border-t border-line">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-brand-green hover:underline"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
