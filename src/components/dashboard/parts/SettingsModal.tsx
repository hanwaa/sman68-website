"use client";

import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MODAL_PANEL, MODAL_TRANSITION } from "@/lib/motion";
import { Sliders, X } from "lucide-react";

type Props = {
  open: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  userName: string;
  emailNotif: boolean;
  pushNotif: boolean;
  onUserNameChange: (value: string) => void;
  onEmailNotifChange: (value: boolean) => void;
  onPushNotifChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
};

export default function SettingsModal({
  open,
  modalRef,
  userName,
  emailNotif,
  pushNotif,
  onUserNameChange,
  onEmailNotifChange,
  onPushNotifChange,
  onSubmit,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_TRANSITION}
            onClick={onClose}
            className="absolute inset-0 bg-brand-pine/70"
          />
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Pengaturan Dashboard"
            initial={MODAL_PANEL.initial}
            animate={MODAL_PANEL.animate}
            exit={MODAL_PANEL.exit}
            transition={MODAL_TRANSITION}
            className="relative w-full max-w-md bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 text-ink focus:outline-none"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
              <div className="flex items-center gap-2">
                <Sliders size={20} className="text-brand-green" />
                <h3 className="font-display font-bold text-lg text-ink">Pengaturan Dashboard</h3>
              </div>
              <button onClick={onClose} className="btn-icon" aria-label="Tutup pengaturan">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Nama Pengguna Tampil
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => onUserNameChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>

              <div className="pt-2 border-t border-line space-y-3">
                <div className="text-xs font-bold text-ink uppercase tracking-wider">
                  Preferensi Notifikasi
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-ink">Email Notifikasi Pengumuman</span>
                  <input
                    type="checkbox"
                    checked={emailNotif}
                    onChange={(e) => onEmailNotifChange(e.target.checked)}
                    className="rounded text-brand-green focus:ring-brand-green w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-medium text-ink">Push Notifikasi Browser</span>
                  <input
                    type="checkbox"
                    checked={pushNotif}
                    onChange={(e) => onPushNotifChange(e.target.checked)}
                    className="rounded text-brand-green focus:ring-brand-green w-4 h-4"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-line flex justify-end gap-2">
                <button type="button" onClick={onClose} className="btn-outline text-xs">
                  Batal
                </button>
                <button type="submit" className="btn-primary text-xs px-5 py-2">
                  Simpan Pengaturan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
