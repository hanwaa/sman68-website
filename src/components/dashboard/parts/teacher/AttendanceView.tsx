"use client";

import { CheckCircle, ChevronLeft, ChevronRight, Clock, FileCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { type AbsensiStatus } from "@/lib/absensi";
import { todayIsoDate, type AttendanceApiRecord } from "@/lib/attendance-api";
import AttendancePhoto from "@/components/dashboard/parts/teacher/AttendancePhoto";

const STATUS_BTN: Record<AbsensiStatus, string> = {
  Masuk: "border-brand-green bg-brand-green text-white",
  Izin: "border-amber-400 bg-amber-400 text-amber-950",
  Sakit: "border-sky-400 bg-sky-400 text-sky-950",
  Alpa: "border-danger bg-danger-deep text-white",
};

const STATUS_META: Record<AbsensiStatus, { color: string; icon: typeof CheckCircle }> = {
  Masuk: { color: "text-brand-green", icon: CheckCircle },
  Izin: { color: "text-amber-600", icon: Clock },
  Sakit: { color: "text-sky-600", icon: FileCheck },
  Alpa: { color: "text-danger-deep", icon: XCircle },
};

type Props = {
  className?: string;
  userName: string;
  roster: { id: string; name: string }[];
  dayRecords: AttendanceApiRecord[];
  attendanceDate: string;
  loading: boolean;
  onDateChange: (iso: string) => void;
  onSetStatus: (studentId: string, name: string, status: AbsensiStatus) => void;
};

export default function AttendanceView({
  className,
  userName,
  roster,
  dayRecords,
  attendanceDate,
  loading,
  onDateChange,
  onSetStatus,
}: Props) {
  const recordOf = (studentId: string) => dayRecords.find((record) => record.studentId === studentId);

  const sortedRoster = [...roster].sort((a, b) => {
    const ra = recordOf(a.id);
    const rb = recordOf(b.id);
    if (ra && !rb) return -1;
    if (!ra && rb) return 1;
    return a.name.localeCompare(b.name);
  });

  const statusCounts = (["Masuk", "Izin", "Sakit", "Alpa"] as AbsensiStatus[]).map((status) => ({
    status,
    value: dayRecords.filter((record) => record.status === status).length,
  }));
  const sudah = dayRecords.filter((record) => record.status).length;
  const belum = Math.max(roster.length - sudah, 0);

  const selectedLabel = new Date(`${attendanceDate}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isToday = attendanceDate === todayIsoDate();

  const shiftDate = (days: number) => {
    const next = new Date(`${attendanceDate}T00:00:00`);
    next.setDate(next.getDate() + days);
    // Format lokal (bukan toISOString) agar tidak bergeser karena zona waktu WIB (UTC+7).
    const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(
      next.getDate()
    ).padStart(2, "0")}`;
    onDateChange(iso);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">
            Absensi Kelas {className ?? "-"}
          </h1>
          <p className="text-muted text-sm">
            {selectedLabel} · Wali Kelas: {userName}
          </p>
        </div>
        <span className="badge bg-brand-green/10 text-brand-green font-semibold self-start sm:self-auto">
          {loading ? (
            <Skeleton className="h-4 w-28" />
          ) : (
            `${sudah}/${roster.length} terisi · ${belum} belum`
          )}
        </span>
      </div>

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="btn-icon h-9 w-9"
            aria-label="Hari sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="h-9 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink focus:border-brand-green focus:outline-none"
            aria-label="Pilih tanggal absensi"
          />
          <button
            onClick={() => shiftDate(1)}
            className="btn-icon h-9 w-9"
            aria-label="Hari berikutnya"
          >
            <ChevronRight size={16} />
          </button>
          {!isToday && (
            <button onClick={() => onDateChange(todayIsoDate())} className="btn-ghost btn-sm">
              Hari ini
            </button>
          )}
        </div>
        <span className="text-xs text-muted">
          {loading
            ? "Memuat rekap..."
            : `${dayRecords.filter((record) => record.status).length} dari ${roster.length} siswa tercatat`}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        {statusCounts.map((item) => {
          const meta = STATUS_META[item.status];
          const Icon = meta.icon;
          return (
            <div key={item.status} className="card p-4">
              <div className="flex items-center justify-between">
                <span className={cn("font-display font-extrabold text-3xl tabular-nums", meta.color)}>
                  {loading ? <Skeleton className="h-8 w-12" /> : item.value}
                </span>
                <Icon size={18} className={meta.color} aria-hidden="true" />
              </div>
              <div className="text-xs font-semibold text-ink mt-1">{item.status}</div>
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display font-bold text-ink text-base">Daftar Kehadiran Siswa</h2>
          <p className="text-xs text-muted">
            Siswa hanya mengunggah foto · wali kelas yang memilih status per tanggal
          </p>
        </div>
        <div className="divide-y divide-line">
          {sortedRoster.map((student) => {
            const rec = recordOf(student.id);
            return (
              <div
                key={student.id}
                className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  {rec?.selfieUrl ? (
                    <a
                      href={rec.selfieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Cek foto absensi"
                      className="flex-shrink-0 rounded-xl ring-brand-green/30 transition-all hover:ring-2"
                    >
                      <AttendancePhoto url={rec.selfieUrl} name={student.name} />
                    </a>
                  ) : (
                    <AttendancePhoto url={null} name={student.name} />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">{student.name}</div>
                    <div className="text-xs text-muted">
                      {rec?.selfieUrl ? (
                        <>
                          Sudah mengirim absen{rec.checkInTime ? ` (${rec.checkInTime})` : ""} ·{" "}
                          <a
                            href={rec.selfieUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-brand-green underline underline-offset-2 hover:text-brand-pine"
                          >
                            cek foto
                          </a>
                        </>
                      ) : rec?.status ? (
                        `Status: ${rec.status} (tanpa foto)`
                      ) : (
                        "Belum ada catatan"
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["Masuk", "Izin", "Sakit", "Alpa"] as AbsensiStatus[]).map((status) => {
                    const active = rec?.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => onSetStatus(student.id, student.name, status)}
                        aria-pressed={active}
                        className={cn(
                          "h-7 rounded-full border px-2.5 text-[11px] font-semibold transition-colors",
                          active
                            ? STATUS_BTN[status]
                            : "border-line bg-white text-muted hover:border-muted hover:text-ink"
                        )}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
