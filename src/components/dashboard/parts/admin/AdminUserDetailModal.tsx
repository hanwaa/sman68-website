"use client";

import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime, relativeDay, userInitials } from "@/components/dashboard/parts/admin/helpers";
import type { AdminUser } from "@/components/dashboard/parts/admin/types";

type Props = {
  user: AdminUser | null;
  modalRef: RefObject<HTMLDivElement | null>;
  onResetPassword: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onClose: () => void;
};

export default function AdminUserDetailModal({
  user,
  modalRef,
  onResetPassword,
  onEdit,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-pine/70"
          />
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={`Detail ${user.name}`}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-card-hover z-10 focus:outline-none max-h-[88vh] overflow-y-auto"
          >
            <button onClick={onClose} className="btn-icon absolute top-4 right-4" aria-label="Tutup detail">
              <X size={16} />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <span className="w-14 h-14 rounded-2xl bg-brand-pine text-brand-lime font-display font-extrabold text-lg flex items-center justify-center flex-shrink-0">
                {userInitials(user.name)}
              </span>
              <div className="min-w-0">
                <h2 className="font-display font-extrabold text-lg text-ink leading-tight truncate">
                  {user.name}
                </h2>
                <p className="text-muted text-xs mt-0.5">Username: {user.username}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className={cn("badge text-[10px]", user.roleKey === "admin"
                    ? "bg-brand-pine text-white"
                    : user.roleKey === "teacher"
                      ? "bg-brand-lime/25 text-brand-pine"
                      : "bg-brand-green/10 text-brand-green")}>
                    {user.role}
                  </span>
                  <span
                    className={cn(
                      "badge text-[10px]",
                      user.status === "Aktif" ? "bg-brand-mist text-brand-green" : "bg-line text-muted"
                    )}
                  >
                    {user.status}
                  </span>
                  {user.activeSessions > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-green">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"
                        aria-hidden="true"
                      />
                      {user.activeSessions} sesi aktif
                    </span>
                  )}
                </div>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "NISN", value: user.nisn },
                { label: "Kelas", value: user.className },
                { label: "NIP / NIG", value: user.nig },
                { label: "Mata Pelajaran", value: user.subject },
                { label: "Jabatan", value: user.position },
                { label: "Wali Kelas", value: user.homeroomName },
                { label: "Keterangan", value: user.detail },
                { label: "Terdaftar", value: user.createdAt ? formatDateTime(user.createdAt) : null },
                {
                  label: "Login Terakhir",
                  value: user.lastLoginAt
                    ? `${formatDateTime(user.lastLoginAt)} (${relativeDay(user.lastLoginAt)})`
                    : null,
                },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label} className="bg-cream rounded-xl p-3">
                    <dt className="text-[10px] text-muted uppercase tracking-wide font-semibold">
                      {item.label}
                    </dt>
                    <dd className="text-xs font-semibold text-ink mt-0.5 break-words">{item.value}</dd>
                  </div>
                ))}
            </dl>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-line">
              <button onClick={() => onResetPassword(user)} className="btn-outline text-xs flex-1">
                <KeyRound size={14} /> Reset Password
              </button>
              <button onClick={() => onEdit(user)} className="btn-primary text-xs flex-1">
                <Pencil size={14} /> Edit Akun
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
