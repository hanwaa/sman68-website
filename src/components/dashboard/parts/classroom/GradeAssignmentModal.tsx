"use client";

import type { RefObject } from "react";
import { GraduationCap, Link2 } from "lucide-react";
import type { ClassAssignment } from "@/lib/classroom";
import ClassroomModal from "@/components/dashboard/parts/classroom/ClassroomModal";
import { Avatar, StatusBadge } from "@/components/dashboard/parts/classroom/ClassroomUi";

type GradeDraft = { grade: string; feedback: string };

type Props = {
  assignment: ClassAssignment | null;
  dialogRef: RefObject<HTMLDivElement | null>;
  gradeDrafts: Record<string, GradeDraft>;
  onGradeDraftChange: (student: string, patch: Partial<GradeDraft>) => void;
  onSave: (student: string) => void;
  onClose: () => void;
};

export default function GradeAssignmentModal({
  assignment,
  dialogRef,
  gradeDrafts,
  onGradeDraftChange,
  onSave,
  onClose,
}: Props) {
  return (
    <ClassroomModal
      open={Boolean(assignment)}
      onClose={onClose}
      label={assignment ? `Periksa ${assignment.title}` : "Periksa tugas"}
      dialogRef={dialogRef}
      wide
    >
      {assignment && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-brand-green" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-ink">Periksa: {assignment.title}</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Tenggat {assignment.due} · {assignment.points} poin ·{" "}
            {assignment.submissions.filter((s) => s.status !== "assigned").length}/
            {assignment.submissions.length} terkumpul
          </p>

          <div className="mt-4 space-y-3">
            {assignment.submissions.map((submission) => (
              <div key={submission.student} className="rounded-xl border border-line p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={submission.initials} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink">{submission.student}</div>
                      <div className="text-[11px] text-muted">
                        {submission.status === "assigned"
                          ? "Belum mengumpulkan"
                          : `Dikumpulkan ${submission.submittedAt ?? "-"}`}
                      </div>
                      {submission.link && (
                        <a
                          href={submission.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 inline-flex max-w-[220px] items-center gap-1 text-[11px] font-semibold text-brand-green hover:underline"
                        >
                          <Link2 size={11} className="flex-shrink-0" aria-hidden="true" />
                          <span className="truncate">Buka pekerjaan (Google Drive)</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={submission.status} />
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="number"
                    min={0}
                    max={assignment.points}
                    placeholder="Nilai"
                    value={gradeDrafts[submission.student]?.grade ?? ""}
                    onChange={(e) =>
                      onGradeDraftChange(submission.student, { grade: e.target.value })
                    }
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30 sm:w-24"
                  />
                  <input
                    placeholder="Umpan balik singkat"
                    value={gradeDrafts[submission.student]?.feedback ?? ""}
                    onChange={(e) =>
                      onGradeDraftChange(submission.student, { feedback: e.target.value })
                    }
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                  <button
                    onClick={() => onSave(submission.student)}
                    className="btn-primary btn-sm flex-shrink-0"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ClassroomModal>
  );
}
