"use client";

import { Camera, CheckCircle, Clock, FileCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { StudentAttendance } from "@/components/dashboard/parts/student/types";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

type Props = {
  className?: string;
  attendance: StudentAttendance[];
  loaded: boolean;
  checkedToday: boolean;
  selfieSrc: string | null;
  checkinTime: string;
  calMonth: string;
  onCalMonthChange: (value: string) => void;
  onOpenCheckin: () => void;
};

export default function AttendanceHistory({
  className,
  attendance,
  loaded,
  checkedToday,
  selfieSrc,
  checkinTime,
  calMonth,
  onCalMonthChange,
  onOpenCheckin,
}: Props) {
  const sorted = [...attendance].sort((a, b) => b.date.getTime() - a.date.getTime());
  const total = sorted.length;
  const hadir = sorted.filter((a) => a.status === "Masuk").length;
  const izin = sorted.filter((a) => a.status === "Izin").length;
  const sakit = sorted.filter((a) => a.status === "Sakit").length;
  const alpa = sorted.filter((a) => a.status === "Alpa").length;
  const persentase = total ? Math.round((hadir / total) * 100) : 0;

  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const monthLabel = (d: Date) =>
    d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const activeMonthKey = calMonth || (sorted[0] ? monthKey(sorted[0].date) : "");
  const calDate = activeMonthKey
    ? new Date(Number(activeMonthKey.split("-")[0]), Number(activeMonthKey.split("-")[1]), 1)
    : new Date();
  const calYear = calDate.getFullYear();
  const calMonthIndex = calDate.getMonth();
  const daysInMonth = new Date(calYear, calMonthIndex + 1, 0).getDate();
  const startOffset = (new Date(calYear, calMonthIndex, 1).getDay() + 6) % 7;
  const recordFor = (day: number) =>
    sorted.find(
      (a) =>
        a.date.getFullYear() === calYear &&
        a.date.getMonth() === calMonthIndex &&
        a.date.getDate() === day
    );
  const daysThisMonth = sorted.filter(
    (a) => a.date.getFullYear() === calYear && a.date.getMonth() === calMonthIndex
  ).length;

  const yearOptions = Array.from(
    new Set([...sorted.map((a) => a.date.getFullYear()), calYear])
  ).sort((a, b) => b - a);

  const formatDay = (d: Date) =>
    d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">Absensi Saya</h1>
          <p className="text-muted text-sm">Semester Gasal · Kelas {className ?? "-"}</p>
        </div>
        <span className="badge bg-brand-green/10 text-brand-green font-semibold self-start sm:self-auto">
          Presensi harian aktif
        </span>
      </div>

      {!loaded ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6"
          aria-busy="true"
          aria-live="polite"
        >
          <span className="sr-only">Memuat rekap absensi...</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          <div className="card p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-3xl text-brand-green tabular-nums">
                {persentase}%
              </span>
              <span className="text-[11px] font-semibold text-muted">kehadiran</span>
            </div>
            <div className="mt-2.5 h-1.5 rounded-full bg-line overflow-hidden">
              <span
                className="block h-full w-full origin-left rounded-full bg-brand-green transition-transform duration-300 ease-out"
                style={{ transform: `scaleX(${persentase / 100})` }}
              />
            </div>
            <div className="text-[11px] text-muted mt-1.5">Dari {total} hari sekolah</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-extrabold text-3xl text-brand-green tabular-nums">
                {hadir}
              </span>
              <CheckCircle size={18} className="text-brand-green" aria-hidden="true" />
            </div>
            <div className="text-xs font-semibold text-ink mt-1">Masuk</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-extrabold text-3xl text-amber-600 tabular-nums">
                {izin}
              </span>
              <Clock size={18} className="text-amber-600" aria-hidden="true" />
            </div>
            <div className="text-xs font-semibold text-ink mt-1">Izin</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-display font-extrabold text-3xl text-ink tabular-nums">
                {sakit + alpa}
              </span>
              <span className="flex items-center gap-1.5">
                <FileCheck size={15} className="text-brand-pine" aria-hidden="true" />
                <XCircle size={15} className="text-danger-deep" aria-hidden="true" />
              </span>
            </div>
            <div className="text-xs font-semibold text-ink mt-1">
              Sakit {sakit} · Alpa {alpa}
            </div>
          </div>
        </div>
      )}

      <div className="card p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-brand-green/10 flex items-center justify-center flex-shrink-0">
            {checkedToday && selfieSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selfieSrc} alt="Foto selfie presensi" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <CheckCircle size={22} className="text-brand-green" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="font-semibold text-ink text-sm">Presensi Hari Ini</div>
            <div className="text-xs text-muted">
              {checkedToday
                ? checkinTime
                  ? `Tercatat pukul ${checkinTime} · foto selfie terlampir`
                  : "Sudah terpresensi, terima kasih!"
                : "Wajib presensi dengan foto selfie · Batas 07.30 WIB"}
            </div>
          </div>
        </div>
        {checkedToday ? (
          <span className="badge bg-brand-green/10 text-brand-green font-semibold self-start sm:self-auto">
            <CheckCircle size={13} aria-hidden="true" /> Terpresensi
          </span>
        ) : (
          <button
            onClick={onOpenCheckin}
            className="btn-primary text-xs px-5 py-2.5 self-start sm:self-auto"
          >
            <Camera size={15} /> Unggah Foto Kehadiran
          </button>
        )}
      </div>

      <div className="card p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display font-bold text-ink text-base">Kalender Kehadiran</h2>
            <p className="text-xs text-muted">{monthLabel(calDate)} · status diisi oleh wali kelas</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge bg-cream text-muted font-semibold">
              {loaded ? `${daysThisMonth} hari sekolah` : <Skeleton className="h-4 w-20" />}
            </span>
            <select
              value={calMonthIndex}
              onChange={(e) => onCalMonthChange(`${calYear}-${e.target.value}`)}
              className="h-8 rounded-full border border-line bg-white px-3 text-xs font-medium text-muted focus:border-brand-green focus:outline-none"
              aria-label="Pilih bulan"
            >
              {MONTH_NAMES.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={calYear}
              onChange={(e) => onCalMonthChange(`${e.target.value}-${calMonthIndex}`)}
              className="h-8 rounded-full border border-line bg-white px-3 text-xs font-medium text-muted focus:border-brand-green focus:outline-none"
              aria-label="Pilih tahun"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-md grid-cols-7 gap-1 text-center">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
            <span key={d} className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {d}
            </span>
          ))}
          {Array.from({ length: startOffset }).map((_, i) => (
            <span key={`blank-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const record = recordFor(day);
            return (
              <span
                key={day}
                title={record ? `${formatDay(record.date)} · ${record.status}` : undefined}
                className={cn(
                  "flex h-9 items-center justify-center rounded-md text-[11px] font-semibold",
                  !record && "bg-cream/70 text-muted",
                  record?.status === "Masuk" && "bg-brand-green text-white",
                  record?.status === "Izin" && "bg-amber-400 text-amber-950",
                  record?.status === "Sakit" && "bg-sky-400 text-sky-950",
                  record?.status === "Alpa" && "bg-danger-deep text-white"
                )}
              >
                {day}
              </span>
            );
          })}
        </div>

        <div className="mx-auto mt-4 flex w-full max-w-md flex-wrap items-center gap-4 border-t border-line pt-3 text-[11px] font-semibold text-muted">
          {(["Masuk", "Izin", "Sakit", "Alpa"] as const).map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  status === "Masuk" && "bg-brand-green",
                  status === "Izin" && "bg-amber-400",
                  status === "Sakit" && "bg-sky-400",
                  status === "Alpa" && "bg-danger-deep"
                )}
                aria-hidden="true"
              />
              {status}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
