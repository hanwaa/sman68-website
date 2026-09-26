"use client";

import { useEffect, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2, X } from "lucide-react";
import type { AdminUser } from "@/components/dashboard/parts/admin/types";

export type UserFormState = {
  name: string;
  username: string;
  role: string;
  detail: string;
  status: string;
};

type Props = {
  user: AdminUser | null;
  modalRef: RefObject<HTMLDivElement | null>;
  form: UserFormState;
  saving: boolean;
  classOptions: string[];
  onFormChange: (form: UserFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onDelete: (user: AdminUser) => void;
  onClose: () => void;
};

export default function AdminEditUserModal({
  user,
  modalRef,
  form,
  saving,
  classOptions,
  onFormChange,
  onSubmit,
  onDelete,
  onClose,
}: Props) {
  useEffect(() => {
    if (user) onFormChange({ name: user.name, username: user.username, role: user.role, detail: user.detail, status: user.status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
            aria-label={`Edit ${user.name}`}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-7 shadow-card-hover z-10 focus:outline-none max-h-[88vh] overflow-y-auto"
          >
            <button onClick={onClose} className="btn-icon absolute top-4 right-4" aria-label="Tutup form edit">
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <span className="w-10 h-10 rounded-xl bg-brand-pine text-brand-lime flex items-center justify-center flex-shrink-0">
                <Pencil size={17} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display font-bold text-lg text-ink leading-tight">Edit Akun</h3>
                <p className="text-muted text-xs">Username saat ini: {user.username}</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => onFormChange({ ...form, name: e.target.value })}
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
                  value={form.username}
                  onChange={(e) => onFormChange({ ...form, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Peran</label>
                  <select
                    value={form.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      onFormChange({ ...form, role, detail: role === "Siswa" ? "" : form.detail });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  >
                    <option value="Siswa">Siswa</option>
                    <option value="Guru">Guru</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => onFormChange({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {form.role === "Siswa" ? "Kelas" : "Keterangan (Mapel / Jabatan)"}
                </label>
                {form.role === "Siswa" ? (
                  <select
                    required
                    value={form.detail}
                    onChange={(e) => onFormChange({ ...form, detail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  >
                    <option value="">Pilih kelas…</option>
                    {[
                      ...(form.detail && !classOptions.includes(form.detail) ? [form.detail] : []),
                      ...classOptions,
                    ].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Contoh: Fisika / Super Admin"
                    value={form.detail}
                    onChange={(e) => onFormChange({ ...form, detail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => onDelete(user)}
                  className="btn-danger text-xs sm:mr-auto"
                >
                  <Trash2 size={14} /> Hapus Akun
                </button>
                <button type="button" onClick={onClose} className="btn-outline text-xs">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Menyimpan..." : "Update"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
