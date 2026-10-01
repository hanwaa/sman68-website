"use client";

import { useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MODAL_PANEL, MODAL_TRANSITION } from "@/lib/motion";
import { Trophy, X } from "lucide-react";
import type { StudentAchievement } from "@/components/dashboard/parts/student/types";

export type AchievementDraft = Omit<StudentAchievement, "id">;

type Props = {
  open: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  onSubmit: (draft: AchievementDraft) => void;
  onClose: () => void;
};

export default function AddAchievementModal({ open, modalRef, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("Kota Jakarta");
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [category, setCategory] = useState("Akademik");
  const [participants, setParticipants] = useState("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setParticipants("");
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
            aria-label="Ajukan Prestasi Baru"
            initial={MODAL_PANEL.initial}
            animate={MODAL_PANEL.animate}
            exit={MODAL_PANEL.exit}
            transition={MODAL_TRANSITION}
            className="relative w-full max-w-md bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-brand-leaf" />
                <h3 className="font-display font-bold text-lg text-ink">Ajukan Prestasi Baru</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-cream text-muted"
                aria-label="Tutup formulir prestasi"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim()) return;
                onSubmit({
                  title,
                  description,
                  level,
                  year,
                  category,
                  participants,
                } as AchievementDraft);
                reset();
                onClose();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Nama Prestasi / Kejuaraan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Juara 1 Lomba Desain Web Nasional"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Deskripsi Prestasi</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ceritakan singkat: ajangnya apa, tingkat apa, dan pencapaianmu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Tingkat</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  >
                    <option value="Kota Jakarta">Tingkat Kota</option>
                    <option value="Provinsi DKI">Tingkat Provinsi</option>
                    <option value="Nasional">Tingkat Nasional</option>
                    <option value="Internasional">Internasional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Tahun</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                >
                  <option value="Akademik">Akademik & Sains</option>
                  <option value="Olahraga">Olahraga</option>
                  <option value="Seni & Budaya">Seni & Budaya</option>
                  <option value="Teknologi">Teknologi & Robotika</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Nama Peserta (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bima Putra, Sari Dewi"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
                <p className="text-[10px] text-muted mt-1">Pisahkan dengan koma bila lebih dari satu.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn-outline text-xs">
                  Batal
                </button>
                <button type="submit" className="btn-primary text-xs px-5 py-2">
                  Kirim untuk Verifikasi
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
