"use client";

import { Award } from "lucide-react";
import { submissionOf, type ClassAssignment } from "@/lib/classroom";
import { StatusBadge } from "@/components/dashboard/parts/classroom/ClassroomUi";

type Props = {
  isTeacher: boolean;
  userName: string;
  assignments: ClassAssignment[];
  average: number | null;
  onOpenGrade: (assignment: ClassAssignment) => void;
};

export default function GradesTab({ isTeacher, userName, assignments, average, onOpenGrade }: Props) {
  return (
    <div className="mt-5 space-y-4">
      {!isTeacher && (
        <div className="card flex items-center justify-between p-4">
          <div>
            <div className="text-xs font-semibold text-muted">Rata-rata nilai kamu</div>
            <div className="font-display text-3xl font-extrabold text-brand-green">
              {average ?? "-"}
            </div>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
            <Award size={22} aria-hidden="true" />
          </span>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">Tugas</th>
              <th className="px-4 py-3 font-semibold">Tenggat</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Nilai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {assignments.map((assignment) => {
              const mine = submissionOf(assignment, userName);
              return (
                <tr key={assignment.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink">{assignment.title}</div>
                    <div className="text-[11px] text-muted">{assignment.topic}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{assignment.due}</td>
                  <td className="px-4 py-3">
                    {isTeacher ? (
                      <span className="text-xs text-muted">
                        {assignment.submissions.filter((s) => s.status === "graded").length}/
                        {assignment.submissions.length} dinilai
                      </span>
                    ) : mine ? (
                      <StatusBadge status={mine.status} />
                    ) : (
                      <span className="text-xs text-muted">,</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isTeacher ? (
                      <button
                        onClick={() => onOpenGrade(assignment)}
                        className="text-xs font-semibold text-brand-green hover:underline"
                      >
                        Periksa
                      </button>
                    ) : (
                      <span className="font-display font-extrabold text-ink">
                        {mine?.grade ?? "-"}
                        <span className="text-xs font-semibold text-muted">/{assignment.points}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
