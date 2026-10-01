"use client";

import { useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MODAL_PANEL, MODAL_TRANSITION } from "@/lib/motion";
import { Bell, X } from "lucide-react";
import type { AnnouncementDraft } from "@/components/dashboard/parts/teacher/types";

type Props = {
  open: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  className?: string;
  onSubmit: (draft: AnnouncementDraft) => void;
  onClose: () => void;
};

export default function AnnouncementModal({ open, modalRef, className, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("Siswa Kelas Ajar");
  const [content, setContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const reset = () => {
    setTitle("");
    setContent("");
    setIsUrgent(false);
  };

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
            aria-label="Buat Pengumuman Kelas"
            initial={MODAL_PANEL.initial}
            animate={MODAL_PANEL.animate}
            exit={MODAL_PANEL.exit}
            transition={MODAL_TRANSITION}
            className="relative w-full max-w-md bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-brand-leaf" />
                <h3 className="font-display font-bold text-lg text-ink">Buat Pengumuman Kelas</h3>
              </div>
              <button onClick={onClose} className="btn-icon" aria-label="Tutup formulir pengumuman">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim()) return;
                onSubmit({ title, body: content, urgent: isUrgent, target });
                reset();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Judul Pengumuman</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Remedial Bab 3 Matematika Peminatan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Target Kelas</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                >
                  <option value="Semua Kelas Ajar">
                    Semua Kelas Ajar{className ? ` (${className})` : ""}
                  </option>
                  {className && <option value={`Kelas ${className}`}>Kelas {className} Saja</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Isi Instruksi</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tuliskan petunjuk jelas bagi siswa..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgentCheck"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="rounded text-brand-leaf focus:ring-brand-leaf"
                />
                <label htmlFor="urgentCheck" className="text-xs font-semibold text-ink cursor-pointer">
                  Tandai sebagai pengumuman mendesak / penting
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn-outline text-xs">
                  Batal
                </button>
                <button type="submit" className="btn-primary text-xs px-5 py-2">
                  Kirimkan Pengumuman
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
