"use client";

import { ClipboardList, Clock, LogIn, Plus, School, UserPlus } from "lucide-react";
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
  homeroomClass: ClassroomClass | null;
  teacherWaliClass: ClassroomClass | null;
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
  homeroomClass,
  teacherWaliClass,
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
  const hasHomeroom = studentClassLabel !== "-";
  // Kelas bawaan wali tidak tampil di grid, aksesnya lewat tombol Masuk di
  // kartu Kelas kamu / Kelas Wali di atas.
  const gridClasses = visibleClasses.filter((c) => !c.id.startsWith("walikelas-"));
  const gridEnrolled = myClasses.filter((c) => !c.id.startsWith("walikelas-"));
  const hasAnyClass = myClasses.length > 0 || studentPendingClasses.length > 0;
  const isEmpty = !hasAnyClass;

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
            {isTeacher ? "Aktif" : hasHomeroom ? studentClassLabel : "-"}
          </div>
          <div className="mt-1 text-xs font-semibold text-ink">
            {isTeacher ? "Semester Gasal" : hasHomeroom ? "Kelas kamu" : "Belum ada kelas"}
          </div>
        </div>
      </div>

      {!isTeacher && hasHomeroom && (
        <div className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-pine text-brand-lime">
            <School size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Kelas kamu</div>
            <div className="font-display text-xl font-extrabold text-ink">{studentClassLabel}</div>
            <div className="text-xs text-muted">Wali Kelas: {studentWaliName}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {homeroomClass && homeroomClass.enrolled && (
              <button
                onClick={() => onOpenClass(homeroomClass)}
                className="btn-primary text-xs"
                aria-label={`Masuk ke kelas digital ${studentClassLabel}`}
              >
                <LogIn size={14} /> Masuk Kelas
              </button>
            )}
            {homeroomClass && !homeroomClass.enrolled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                <Clock size={11} aria-hidden="true" />
                Menunggu persetujuan
              </span>
            )}
          </div>
        </div>
      )}

      {isTeacher && teacherWaliClass && (
        <div className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-pine text-brand-lime">
            <School size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Kelas wali kamu
            </div>
            <div className="font-display text-xl font-extrabold text-ink">
              {teacherWaliClass.section}
            </div>
            <div className="text-xs text-muted">
              {teacherWaliClass.students.length} siswa · {teacherWaliClass.room}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <button
              onClick={() => onOpenClass(teacherWaliClass)}
              className="btn-primary text-xs"
              aria-label={`Masuk ke kelas digital ${teacherWaliClass.section}`}
            >
              <LogIn size={14} /> Masuk Kelas
            </button>
          </div>
        </div>
      )}

      {!isTeacher && !hasHomeroom && (
        <div className="card mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-pine text-brand-lime">
            <School size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Kelas kamu</div>
            <div className="font-display text-xl font-extrabold text-ink">Belum ada kelas</div>
            <div className="text-xs text-muted">
              Kelas bawaan wali kelas belum tampil, coba muat ulang, atau gabung dengan kode
              dari wali kelas.
            </div>
          </div>
          <button onClick={onOpenClassModal} className="btn-primary text-xs sm:ml-auto">
            <Plus size={14} /> Gabung Kelas
          </button>
        </div>
      )}

      {!isTeacher && gridEnrolled.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => onSubjectFilterChange("Semua")}
            className={cn("chip", subjectFilter === "Semua" && "chip-active")}
          >
            Semua Mapel
          </button>
          {gridEnrolled.map((cls) => (
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
        {isEmpty && (
          <div className="card p-8 text-center sm:col-span-2 xl:col-span-3">
            <School size={28} className="mx-auto mb-3 text-line" aria-hidden="true" />
            <div className="text-sm font-semibold text-ink">
              {isTeacher ? "Belum ada kelas digital" : "Belum ada kelas yang diikuti"}
            </div>
            <div className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted">
              {isTeacher
                ? "Buat kelas baru untuk mata pelajaranmu, lalu bagikan kodenya agar siswa bisa bergabung dan meminta persetujuan."
                : studentPendingClasses.length > 0
                  ? "Permintaan bergabungmu sedang menunggu persetujuan guru."
                  : "Kelas bawaan wali kelas seharusnya otomatis muncul di sini. Minta kode kelas ke wali kelas lalu pakai tombol Gabung Kelas, atau hubungi Tata Usaha bila akunmu belum tertaut ke rombel."}
            </div>
            <button onClick={onOpenClassModal} className="btn-primary mx-auto mt-4 text-xs">
              <Plus size={14} /> {isTeacher ? "Buat Kelas Pertama" : "Gabung Kelas"}
            </button>
          </div>
        )}
        {gridClasses.map((cls) => {
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
