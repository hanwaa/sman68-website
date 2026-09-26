"use client";

import { useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, X } from "lucide-react";

export type NewUserDraft = { name: string; username: string; role: string; detail: string };

type Props = {
  open: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  classOptions: string[];
  onSubmit: (draft: NewUserDraft) => void;
  onClose: () => void;
};

export default function AdminCreateUserModal({
  open,
  modalRef,
  classOptions,
  onSubmit,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("Siswa");
  const [detail, setDetail] = useState("");

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-pine/70"
          />
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Tambah User Baru"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-brand-green" />
                <h3 className="font-display font-bold text-lg text-ink">Tambah User Baru</h3>
              </div>
              <button onClick={onClose} className="btn-icon" aria-label="Tutup formulir user">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ name, username, role, detail });
                setName("");
                setUsername("");
                setDetail("");
                onClose();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Nurhaliza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Username (NISN / NIP / NPSN)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0068100101"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
                <p className="text-[10px] text-muted mt-1">
                  Password awal otomatis sama dengan username ini.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Peran</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const next = e.target.value;
                      setRole(next);
                      if (next === "Siswa") setDetail("");
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  >
                    <option value="Siswa">Siswa</option>
                    <option value="Guru">Guru</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {role === "Siswa" ? "Kelas" : "Keterangan"}
                  </label>
                  {role === "Siswa" ? (
                    <select
                      required
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    >
                      <option value="">Pilih kelas…</option>
                      {classOptions.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Mapel / Jabatan"
                      value={detail}
                      onChange={(e) => setDetail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={onClose} className="btn-outline text-xs">
                  Batal
                </button>
                <button type="submit" className="btn-primary text-xs px-5 py-2">
                  Tambahkan User
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
