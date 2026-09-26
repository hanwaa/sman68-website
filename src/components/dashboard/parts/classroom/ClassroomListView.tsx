"use client";

import { ClipboardList, Clock, Plus, School, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { classInitials, type ClassroomClass } from "@/lib/classroom";

type Props = {
  isTeacher: boolean;
  myClasses: ClassroomClass[];
  studentPendingClasses: ClassroomClass[];
  subjectFilter: string;
  studentPending: number;
  teacherToGrade: number;
  teacherRequests: number;
  studentClassLabel: string;
  studentWaliName: string;
  assignmentCountFor: (classId: string) => number;
  doneCountFor: (cls: ClassroomClass) => number;
  onSubjectFilterChange: (value: string) => void;
  onOpenClass: (cls: ClassroomClass) => void;
  onOpenClassModal: () => void;
  onReviewRequest: () => void;
};

export default function ClassroomListView({
  isTeacher,
  myClasses,
  studentPendingClasses,
  subjectFilter,
  studentPending,
  teacherToGrade,
  teacherRequests,
  studentClassLabel,
  studentWaliName,
  assignmentCountFor,
  doneCountFor,
  onSubjectFilterChange,
  onOpenClass,
  onOpenClassModal,
  onReviewRequest,
}: Props) {
  const visibleClasses = isTeacher
    ? myClasses
    : subjectFilter === "Semua"
      ? [...myClasses, ...studentPendingClasses]
      : myClasses.filter((c) => c.name === subjectFilter);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink md:text-3xl">Kelas Digital</h1>
          <p className="text-sm text-muted">
            {isTeacher
              ? "Kelola kelas, materi, tugas, dan nilai siswa seperti ruang kelas online."
              : "Ikuti materi, kumpulkan tugas, dan pantau nilai kelasmu di satu tempat."}
          </p>
        </div>
        <button
          onClick={onOpenClassModal}
          className={cn("self-start sm:self-auto", isTeacher ? "btn-primary" : "btn-ghost")}
        >
          <Plus size={15} /> {isTeacher ? "Buat Kelas" : "Gabung Kelas"}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="font-display text-2xl font-extrabold text-brand-green">{myClasses.length}</div>
          <div className="mt-1 text-xs font-semibold text-ink">
            {isTeacher ? "Kelas Diampu" : "Kelas Diikuti"}
          </div>
        </div>
        <div className="card p-4">
          <div className="font-display text-2xl font-extrabold text-brand-pine">
            {isTeacher ? teacherToGrade : studentPending}
          </div>
          <div className="mt-1 text-xs font-semibold text-ink">
            {isTeacher ? "Perlu Dinilai" : "Tugas Menunggu"}
          </div>
        </div>
        <div className="card col-span-2 p-4 sm:col-span-1">
          <div className="font-display text-2xl font-extrabold text-brand-leaf">
            {isTeacher ? "Aktif" : studentClassLabel}
          </div>
          <div className="mt-1 text-xs font-semibold text-ink">
            {isTeacher ? "Semester Gasal" : "Kelas kamu"}
          </div>
        </div>
      </div>

      {!isTeacher && (
        <div className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-pine text-brand-lime">
            <School size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Kelas kamu</div>
            <div className="font-display text-xl font-extrabold text-ink">{studentClassLabel}</div>
            <div className="text-xs text-muted">Wali Kelas: {studentWaliName}</div>
          </div>
          <span className="badge bg-brand-green/10 font-semibold text-brand-green sm:ml-auto">
            {myClasses.length} mata pelajaran
          </span>
        </div>
      )}

      {!isTeacher && myClasses.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => onSubjectFilterChange("Semua")}
            className={cn("chip", subjectFilter === "Semua" && "chip-active")}
          >
            Semua Mapel
          </button>
          {myClasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => onSubjectFilterChange(cls.name)}
              className={cn("chip", subjectFilter === cls.name && "chip-active")}
            >
              {cls.name}
            </button>
          ))}
        </div>
      )}

      {isTeacher && teacherRequests > 0 && (
        <div className="card mb-5 flex flex-col gap-3 border-brand-lime/40 bg-brand-lime/10 p-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-lime/25 text-brand-pine">
            <UserPlus size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">
              {teacherRequests} permintaan bergabung menunggu
            </div>
            <div className="text-xs text-muted">Tinjau siswa yang ingin masuk ke kelas Anda.</div>
          </div>
          <button onClick={onReviewRequest} className="btn-primary self-start text-xs sm:self-auto">
            Tinjau
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleClasses.map((cls) => {
          const assignments = assignmentCountFor(cls.id);
          const done = doneCountFor(cls);
          return (
            <button
              key={cls.id}
              onClick={() => (isTeacher || cls.enrolled ? onOpenClass(cls) : undefined)}
              disabled={!isTeacher && !cls.enrolled}
              className={cn(
                "card group flex flex-col overflow-hidden text-left",
                !isTeacher && !cls.enrolled && "cursor-default"
              )}
            >
              <div className={cn("relative p-5 text-white", cls.color)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-bold leading-snug">{cls.name}</h2>
                    <p className="mt-0.5 text-xs text-white/70">
                      {cls.section} · {cls.room}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/15 text-xs font-bold">
                    {classInitials(cls.name)}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-white/75">
                  {cls.teacher}
                </p>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="line-clamp-2 text-xs leading-relaxed text-muted">{cls.description}</p>
                {isTeacher && cls.requests.length > 0 && (
                  <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-brand-lime/25 px-2 py-0.5 text-[10px] font-bold text-brand-pine">
                    <UserPlus size={11} aria-hidden="true" />
                    {cls.requests.length} permintaan bergabung
                  </span>
                )}
                {!isTeacher && !cls.enrolled && (
                  <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    <Clock size={11} aria-hidden="true" />
                    Menunggu persetujuan guru
                  </span>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px]">
                  <span className="flex items-center gap-1 text-muted">
                    <ClipboardList size={12} aria-hidden="true" />
                    {assignments} tugas
                  </span>
                  <span className="font-semibold text-brand-green">
                    {isTeacher ? `${done} terkumpul` : `${done} selesai`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
