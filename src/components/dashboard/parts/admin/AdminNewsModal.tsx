"use client";

import { useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MODAL_PANEL, MODAL_TRANSITION } from "@/lib/motion";
import { Newspaper, X } from "lucide-react";

export type NewsDraft = { title: string; category: string; excerpt: string };

type Props = {
  open: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  onSubmit: (draft: NewsDraft) => void;
  onClose: () => void;
};

export default function AdminNewsModal({ open, modalRef, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Prestasi");
  const [excerpt, setExcerpt] = useState("");

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
            aria-label="Publikasikan Berita Baru"
            initial={MODAL_PANEL.initial}
            animate={MODAL_PANEL.animate}
            exit={MODAL_PANEL.exit}
            transition={MODAL_TRANSITION}
            className="relative w-full max-w-lg bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Newspaper size={20} className="text-brand-green" />
                <h3 className="font-display font-bold text-lg text-ink">Publikasikan Berita Baru</h3>
              </div>
              <button onClick={onClose} className="btn-icon" aria-label="Tutup formulir berita">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ title, category, excerpt });
                setTitle("");
                setExcerpt("");
                onClose();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Judul Berita</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siswa SMAN 68 Raih Medali Emas Olimpiade Kimia"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                >
                  <option value="Prestasi">Prestasi</option>
                  <option value="Kegiatan">Kegiatan</option>
                  <option value="Akademik">Akademik</option>
                  <option value="Pengumuman">Pengumuman</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Ringkasan Berita</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan ringkasan singkat untuk artikel ini..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn-outline text-xs">
                  Batal
                </button>
                <button type="submit" className="btn-primary text-xs px-5 py-2">
                  Terbitkan Sekarang
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
