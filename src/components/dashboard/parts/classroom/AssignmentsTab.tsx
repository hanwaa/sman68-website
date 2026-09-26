"use client";

import { Award, CheckCircle, ClipboardList, Clock, FileText, Link2, Paperclip, Plus, Upload } from "lucide-react";
import { submissionOf, type ClassAssignment } from "@/lib/classroom";
import { StatusBadge } from "@/components/dashboard/parts/classroom/ClassroomUi";

type Props = {
  isTeacher: boolean;
  userName: string;
  assignments: ClassAssignment[];
  onCreate: () => void;
  onOpenGrade: (assignment: ClassAssignment) => void;
  onOpenDetail: (assignment: ClassAssignment) => void;
};

export default function AssignmentsTab({
  isTeacher,
  userName,
  assignments,
  onCreate,
  onOpenGrade,
  onOpenDetail,
}: Props) {
  return (
    <div className="mt-5 space-y-4">
      {isTeacher && (
        <div className="flex justify-end">
          <button onClick={onCreate} className="btn-primary btn-sm">
            <Plus size={14} /> Buat Tugas
          </button>
        </div>
      )}

      {assignments.length === 0 && (
        <div className="card p-8 text-center">
          <ClipboardList size={28} className="mx-auto mb-3 text-line" aria-hidden="true" />
          <div className="text-sm font-semibold text-ink">Belum ada tugas</div>
          <div className="mt-1 text-xs text-muted">
            {isTeacher ? "Buat tugas pertama untuk kelas ini." : "Tugas baru akan tampil di sini."}
          </div>
        </div>
      )}

      {assignments.map((assignment) => {
        const mine = submissionOf(assignment, userName);
        const turnedIn = assignment.submissions.filter((s) => s.status !== "assigned").length;
        const graded = assignment.submissions.filter((s) => s.status === "graded").length;
        return (
          <div key={assignment.id} className="card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3.5">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                  <FileText size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-sm font-bold text-ink">{assignment.title}</h2>
                    <span className="badge bg-cream text-[10px] font-semibold text-muted">
                      {assignment.topic}
                    </span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} aria-hidden="true" /> Tenggat: {assignment.due}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award size={11} aria-hidden="true" /> {assignment.points} poin
                    </span>
                  </p>
                  {assignment.attachment && (
                    <a
                      href={assignment.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold text-brand-green hover:underline"
                    >
                      {assignment.attachment.type === "drive" ? (
                        <Link2 size={11} aria-hidden="true" />
                      ) : (
                        <Paperclip size={11} aria-hidden="true" />
                      )}
                      <span className="truncate">{assignment.attachment.name}</span>
                    </a>
                  )}
                </div>
              </div>

              {isTeacher ? (
                <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
                  <span className="text-[11px] text-muted">
                    {turnedIn}/{assignment.submissions.length} terkumpul · {graded} dinilai
                  </span>
                  <button onClick={() => onOpenGrade(assignment)} className="btn-ghost btn-sm">
                    <CheckCircle size={13} /> Periksa
                  </button>
                </div>
              ) : (
                <div className="flex flex-shrink-0 flex-col items-start gap-2 sm:items-end">
                  {mine && <StatusBadge status={mine.status} />}
                  {mine?.status === "graded" && (
                    <span className="font-display text-lg font-extrabold text-brand-green">
                      {mine.grade}
                      <span className="text-xs font-semibold text-muted">/{assignment.points}</span>
                    </span>
                  )}
                  <button onClick={() => onOpenDetail(assignment)} className="btn-primary btn-sm">
                    {mine?.status === "assigned" ? (
                      <>
                        <Upload size={13} /> Kumpulkan
                      </>
                    ) : (
                      "Lihat Pengumpulan"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
