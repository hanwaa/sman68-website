"use client";

import { useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MODAL_PANEL, MODAL_TRANSITION } from "@/lib/motion";
import { Bell, X } from "lucide-react";

export type MemoDraft = { title: string; target: string; content: string };

type Props = {
  open: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  onSubmit: (draft: MemoDraft) => void;
  onClose: () => void;
};

export default function AdminAnnouncementModal({ open, modalRef, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("Semua Komunitas");
  const [content, setContent] = useState("");

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
            aria-label="Siarkan Memo Resmi"
            initial={MODAL_PANEL.initial}
            animate={MODAL_PANEL.animate}
            exit={MODAL_PANEL.exit}
            transition={MODAL_TRANSITION}
            className="relative w-full max-w-lg bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-brand-leaf" />
                <h3 className="font-display font-bold text-lg text-ink">Siarkan Memo Resmi</h3>
              </div>
              <button onClick={onClose} className="btn-icon" aria-label="Tutup formulir memo">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ title, target, content });
                setTitle("");
                setContent("");
                onClose();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Judul Memo / Pengumuman
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penyesuaian Jadwal Belajar Mengajar Pekan Ini"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Target Sasaran</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                >
                  <option value="Semua Komunitas">Semua (Siswa, Guru & Staf)</option>
                  <option value="Siswa Saja">Siswa Saja</option>
                  <option value="Guru & Staf">Guru & Staf Saja</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Isi Pesan</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan isi memo pengumuman secara jelas..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn-outline text-xs">
                  Batal
                </button>
                <button type="submit" className="btn-primary text-xs px-5 py-2">
                  Siarkan Sekarang
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
