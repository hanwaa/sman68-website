"use client";

import type { RefObject } from "react";
import { Clock, FileText, Link2, Paperclip, Upload } from "lucide-react";
import { submissionOf, type ClassAssignment } from "@/lib/classroom";
import ClassroomModal from "@/components/dashboard/parts/classroom/ClassroomModal";
import { StatusBadge } from "@/components/dashboard/parts/classroom/ClassroomUi";

type Props = {
  assignment: ClassAssignment | null;
  userName: string;
  dialogRef: RefObject<HTMLDivElement | null>;
  driveLink: string;
  onDriveLinkChange: (value: string) => void;
  onSubmitLink: (assignmentId: string) => void;
  onCancelSubmit: (assignmentId: string) => void;
  onClose: () => void;
};

export default function AssignmentDetailModal({
  assignment,
  userName,
  dialogRef,
  driveLink,
  onDriveLinkChange,
  onSubmitLink,
  onCancelSubmit,
  onClose,
}: Props) {
  const mine = assignment ? submissionOf(assignment, userName) : undefined;
  const submitted = Boolean(mine && mine.status !== "assigned");

  return (
    <ClassroomModal
      open={Boolean(assignment)}
      onClose={onClose}
      label={assignment?.title ?? "Detail tugas"}
      dialogRef={dialogRef}
    >
      {assignment && (
        <div className="mt-2">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
              <FileText size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink">{assignment.title}</h2>
              <p className="text-xs text-muted">
                {assignment.topic} · {assignment.points} poin
              </p>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/85">
            {assignment.instructions}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Clock size={12} aria-hidden="true" /> Tenggat: {assignment.due}
            </span>
            {assignment.attachment && (
              <a
                href={assignment.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-brand-green hover:underline"
              >
                {assignment.attachment.type === "drive" ? (
                  <Link2 size={12} aria-hidden="true" />
                ) : (
                  <Paperclip size={12} aria-hidden="true" />
                )}
                {assignment.attachment.name}
              </a>
            )}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-ink">Pengumpulan kamu</div>
              {mine ? <StatusBadge status={mine.status} /> : null}
            </div>

            {mine?.status === "graded" && (
              <div className="mt-3 rounded-lg bg-brand-green/5 px-3 py-2.5 text-xs">
                <div className="font-display text-lg font-extrabold text-brand-green">
                  {mine.grade}
                  <span className="text-xs font-semibold text-muted">/{assignment.points}</span>
                </div>
                {mine.feedback && <p className="mt-1 text-muted">{mine.feedback}</p>}
              </div>
            )}

            <label className="mt-3 mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink">
              <Link2 size={13} className="text-brand-green" aria-hidden="true" />
              Tautan Google Drive
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={driveLink}
                onChange={(e) => onDriveLinkChange(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-xs focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
              <button
                onClick={() => onSubmitLink(assignment.id)}
                className="btn-primary btn-sm flex-shrink-0"
              >
                <Upload size={13} /> {submitted ? "Perbarui" : "Kumpulkan"}
              </button>
            </div>

            {submitted && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={mine?.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold text-brand-green hover:underline"
                >
                  <Link2 size={12} aria-hidden="true" />
                  <span className="truncate">{mine?.link}</span>
                </a>
                {mine?.status !== "graded" && (
                  <button
                    onClick={() => onCancelSubmit(assignment.id)}
                    className="text-[11px] font-semibold text-muted underline-offset-2 hover:text-ink hover:underline"
                  >
                    Batalkan pengumpulan
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </ClassroomModal>
  );
}
