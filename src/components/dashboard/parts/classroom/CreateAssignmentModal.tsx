"use client";

import { useState, type RefObject } from "react";
import { Paperclip, Send, Upload, X } from "lucide-react";
import type { ClassAttachment } from "@/lib/classroom";
import ClassroomModal from "@/components/dashboard/parts/classroom/ClassroomModal";

export type AssignmentDraft = {
  title: string;
  topic: string;
  points: string;
  due: string;
  instructions: string;
};

type Props = {
  open: boolean;
  dialogRef: RefObject<HTMLDivElement | null>;
  file: ClassAttachment | null;
  link: string;
  onLinkChange: (value: string) => void;
  onFileChange: (file: ClassAttachment | null) => void;
  onFilePicked: (file: File | undefined) => void;
  onSubmit: (draft: AssignmentDraft) => void;
  onClose: () => void;
};

export default function CreateAssignmentModal({
  open,
  dialogRef,
  file,
  link,
  onLinkChange,
  onFileChange,
  onFilePicked,
  onSubmit,
  onClose,
}: Props) {
  const [form, setForm] = useState<AssignmentDraft>({
    title: "",
    topic: "",
    points: "100",
    due: "",
    instructions: "",
  });

  return (
    <ClassroomModal open={open} onClose={onClose} label="Buat tugas baru" dialogRef={dialogRef}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
          setForm({ title: "", topic: "", points: "100", due: "", instructions: "" });
          onClose();
        }}
        className="mt-2 space-y-3.5"
      >
        <h2 className="font-display text-lg font-bold text-ink">Buat Tugas</h2>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">Judul</label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Contoh: Latihan Integral"
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Topik</label>
            <input
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="Integral"
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink">Poin</label>
            <input
              type="number"
              min={0}
              value={form.points}
              onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
              className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">Tenggat</label>
          <input
            value={form.due}
            onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))}
            placeholder="Jumat, 23.59"
            className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">Lampiran Materi</label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="btn-outline btn-sm cursor-pointer">
              <Upload size={13} />
              {file ? "Ganti Berkas" : "Unggah Berkas"}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.mp4"
                onChange={(e) => {
                  onFilePicked(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <span className="text-[11px] text-muted">atau</span>
            <input
              value={link}
              onChange={(e) => onLinkChange(e.target.value)}
              placeholder="Tautan Google Drive (opsional)"
              className="min-w-[180px] flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          {file && (
            <div className="mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-cream px-3 py-2 text-xs font-semibold text-ink">
              <Paperclip size={13} className="flex-shrink-0 text-brand-green" />
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onFileChange(null)}
                className="btn-icon h-6 w-6"
                aria-label="Hapus lampiran"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink">Instruksi</label>
          <textarea
            value={form.instructions}
            onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
            rows={3}
            placeholder="Tulis instruksi pengerjaan..."
            className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-outline">
            Batal
          </button>
          <button type="submit" className="btn-primary">
            <Send size={14} /> Publikasikan
          </button>
        </div>
      </form>
    </ClassroomModal>
  );
}
