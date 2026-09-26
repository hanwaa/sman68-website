"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Plus,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  XCircle,
  X,
  Megaphone,
  Pin,
  AlertCircle,
  Inbox,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { useModalA11y } from "@/lib/useModalA11y";
import { type AbsensiStatus } from "@/lib/absensi";
import UpcomingAgenda from "@/components/dashboard/UpcomingAgenda";

const Classroom = dynamic(() => import("@/components/dashboard/Classroom"), {
  loading: () => <Skeleton className="h-96 w-full" />,
});
import {
  apiFetchAttendance,
  apiPushAttendance,
  todayIsoDate,
  type AttendanceApiRecord,
} from "@/lib/attendance-api";

const STATUS_BTN: Record<AbsensiStatus, string> = {
  Masuk: "border-brand-green bg-brand-green text-white",
  Izin: "border-amber-400 bg-amber-400 text-amber-950",
  Sakit: "border-sky-400 bg-sky-400 text-sky-950",
  Alpa: "border-red-500 bg-red-500 text-white",
};

function AttendancePhoto({ url, name }: { url?: string | null; name: string }) {
  if (!url) {
    return (
      <div className="w-11 h-11 rounded-xl bg-line flex items-center justify-center flex-shrink-0">
        <Clock size={16} className="text-muted" aria-hidden="true" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Foto absensi ${name}`}
      className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
    />
  );
}

interface TeacherDashboardProps {
  userName: string;
  className?: string;
  activePage?: string;
  onShowToast?: (msg: string) => void;
  onNavigate?: (page: string) => void;
}

type RosterStudent = { id: string; name: string };

export default function TeacherDashboard({
  userName,
  className,
  activePage = "beranda",
  onShowToast = () => {},
  onNavigate = () => {},
}: TeacherDashboardProps) {
  const [announcements, setAnnouncements] = useState<{
    id: string;
    title: string;
    body: string;
    time: string;
    urgent: boolean;
    pinned: boolean;
    audience: string;
    author: string;
  }[]>([]);
  const [annFilter, setAnnFilter] = useState<"semua" | "penting" | "saya">("semua");
  const [showModal, setShowModal] = useState(false);
  const modalRef = useModalA11y<HTMLDivElement>(showModal, () => setShowModal(false));

  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(() => todayIsoDate());
  const [dayRecords, setDayRecords] = useState<AttendanceApiRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Daftar siswa wali kelas dari Neon
  useEffect(() => {
    if (!className) return;
    let cancelled = false;
    fetch(`/api/students?class=${encodeURIComponent(className)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { data?: RosterStudent[] } | null) => {
        if (!cancelled && payload?.data) setRoster(payload.data);
      })
      .catch(() => {
        /* daftar kosong bila API tidak tersedia */
      });
    return () => {
      cancelled = true;
    };
  }, [className]);

  // Rekap absensi per tanggal dari Neon — ganti tanggal = ganti data
  useEffect(() => {
    let cancelled = false;
    setAttendanceLoading(true);
    apiFetchAttendance({ date: attendanceDate, className })
      .then((records) => {
        if (!cancelled) setDayRecords(records ?? []);
      })
      .finally(() => {
        if (!cancelled) setAttendanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attendanceDate, className]);

  // Sinkronkan pengumuman guru dari Neon
  useEffect(() => {
    let cancelled = false;
    fetch("/api/announcements?audience=teacher", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          payload:
            | {
                data?: {
                  id: string;
                  title: string;
                  body: string;
                  audience: string;
                  urgent: boolean;
                  pinned: boolean;
                  author: string;
                  time: string;
                }[];
              }
            | null
        ) => {
          if (cancelled || !payload?.data?.length) return;
          setAnnouncements(
            payload.data.map((item) => ({
              id: item.id,
              title: item.title,
              body: item.body,
              audience: item.audience,
              time: item.time,
              urgent: item.urgent,
              pinned: item.pinned,
              author: item.author,
            }))
          );
        }
      )
      .catch(() => {
        /* API tidak tersedia — biarkan kosong, tanpa pengumuman demo */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Form State
  const [annTitle, setAnnTitle] = useState("");
  const [annTarget, setAnnTarget] = useState("Siswa Kelas Ajar");
  const [annContent, setAnnContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) return;

    const newAnn = {
      id: "ann-" + Date.now(),
      title: annTitle,
      body: annContent,
      time: "Baru saja",
      urgent: isUrgent,
      pinned: false,
      audience: "student",
      author: userName,
    };

    setAnnouncements((prev) => [newAnn, ...prev]);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          body: annContent,
          audience: "student",
          urgent: isUrgent,
          author: userName,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        onShowToast(payload?.error ?? "Gagal menyimpan pengumuman ke server.");
      } else {
        onShowToast(`Pengumuman "${annTitle}" berhasil diterbitkan untuk ${annTarget}!`);
      }
    } catch {
      onShowToast("Pengumuman tersimpan lokal — server tidak terjangkau.");
    }

    setAnnTitle("");
    setAnnContent("");
    setIsUrgent(false);
    setShowModal(false);
  };

  let content: React.ReactNode;

  // SUB-PAGE: KELAS DIGITAL (Google Classroom style)
  if (activePage === "kelas") {
    content = <Classroom role="teacher" userName={userName} onShowToast={onShowToast} />;
  } else if (activePage === "absensi") {
    const recordOf = (studentId: string) =>
      dayRecords.find((record) => record.studentId === studentId);

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
      setAttendanceDate(iso);
    };

    const handleSetStatus = async (studentId: string, name: string, status: AbsensiStatus) => {
      // Pertahankan foto/waktu check-in yang sudah ada saat mengganti status
      setDayRecords((prev) => {
        const existing = prev.find((record) => record.studentId === studentId);
        return [
          ...prev.filter((record) => record.studentId !== studentId),
          {
            ...(existing ?? {}),
            studentId,
            name: existing?.name ?? name,
            date: attendanceDate,
            status,
          },
        ];
      });
      onShowToast(`${name} ditandai "${status}" untuk ${selectedLabel}.`);

      const ok = await apiPushAttendance({
        studentId,
        date: attendanceDate,
        status,
        recordedBy: userName,
      });
      if (ok) {
        const records = await apiFetchAttendance({ date: attendanceDate });
        if (records) setDayRecords(records);
      }
    };

    content = (
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
            {attendanceLoading ? (
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
              onChange={(e) => e.target.value && setAttendanceDate(e.target.value)}
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
              <button onClick={() => setAttendanceDate(todayIsoDate())} className="btn-ghost btn-sm">
                Hari ini
              </button>
            )}
          </div>
          <span className="text-xs text-muted">
            {attendanceLoading
              ? "Memuat rekap..."
              : `${dayRecords.filter((record) => record.status).length} dari ${roster.length} siswa tercatat`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          {statusCounts.map((item) => {
            const meta = {
              Masuk: { color: "text-brand-green", icon: CheckCircle },
              Izin: { color: "text-amber-600", icon: Clock },
              Sakit: { color: "text-sky-600", icon: FileCheck },
              Alpa: { color: "text-red-600", icon: XCircle },
            }[item.status];
            const Icon = meta.icon;
            return (
              <div key={item.status} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className={cn("font-display font-extrabold text-3xl tabular-nums", meta.color)}>
                    {attendanceLoading ? <Skeleton className="h-8 w-12" /> : item.value}
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
            <h2 className="font-display font-bold text-ink text-base">
              Daftar Kehadiran Siswa
            </h2>
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
                          onClick={() => handleSetStatus(student.id, student.name, status)}
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
  } else if (activePage === "pengumuman") {
    const urgentCount = announcements.filter((a) => a.urgent).length;
    const mineCount = announcements.filter((a) => a.author === userName).length;
    const visibleAnnouncements = announcements.filter((a) =>
      annFilter === "penting" ? a.urgent : annFilter === "saya" ? a.author === userName : true
    );

    content = (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-brand-green">
              <Megaphone size={15} aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Papan Pengumuman</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mt-1">
              Pengumuman Guru &amp; Staf
            </h1>
            <p className="text-muted text-sm">Kelola dan terbitkan instruksi kepada siswa</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs px-4 py-2.5 self-start sm:self-auto"
          >
            <Plus size={15} /> Buat Pengumuman
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          {[
            { label: "Total Pengumuman", value: announcements.length, icon: Bell, tone: "bg-brand-green/10 text-brand-green" },
            { label: "Mendesak", value: urgentCount, icon: AlertCircle, tone: "bg-red-100 text-red-600" },
            { label: "Terbitan Saya", value: mineCount, icon: User, tone: "bg-brand-lime/25 text-brand-pine" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card p-4 flex items-center gap-3">
                <span
                  className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", s.tone)}
                  aria-hidden="true"
                >
                  <Icon size={18} />
                </span>
                <div>
                  <div className="font-display font-extrabold text-xl text-ink leading-none">{s.value}</div>
                  <div className="text-[11px] text-muted mt-1 font-medium">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mb-4" role="group" aria-label="Filter pengumuman">
          {(
            [
              { id: "semua", label: "Semua" },
              { id: "penting", label: `Mendesak${urgentCount ? ` (${urgentCount})` : ""}` },
              { id: "saya", label: "Terbitan Saya" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setAnnFilter(f.id)}
              aria-pressed={annFilter === f.id}
              className={cn("chip", annFilter === f.id && "chip-active")}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visibleAnnouncements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-line">
            <div className="w-14 h-14 rounded-2xl bg-cream border border-line flex items-center justify-center mx-auto mb-4">
              <Inbox size={24} className="text-muted" aria-hidden="true" />
            </div>
            <div className="font-semibold text-ink">Belum ada pengumuman di filter ini</div>
            <div className="text-muted text-sm mt-1">Terbitkan pengumuman lewat tombol Buat Pengumuman.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAnnouncements.map((ann) => (
              <article
                key={ann.id}
                className={cn(
                  "card relative overflow-hidden p-5 transition-all",
                  ann.urgent && "border-red-200 bg-gradient-to-r from-red-50/60 via-white to-white"
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 w-1",
                    ann.urgent ? "bg-red-500" : ann.pinned ? "bg-brand-lime" : "bg-brand-green/40"
                  )}
                  aria-hidden="true"
                />
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-extrabold text-xs",
                      ann.urgent ? "bg-red-100 text-red-600" : "bg-brand-pine text-brand-lime"
                    )}
                    aria-hidden="true"
                  >
                    {(ann.author || "Admin")
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase() || "AD"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {ann.urgent && (
                        <span className="badge bg-red-100 text-red-700 text-[10px] font-bold">Penting</span>
                      )}
                      {ann.pinned && (
                        <span className="badge bg-brand-lime/25 text-brand-pine text-[10px] font-bold inline-flex items-center gap-1">
                          <Pin size={10} aria-hidden="true" /> Disematkan
                        </span>
                      )}
                      <span className="badge bg-brand-green/10 text-brand-green text-[10px] font-semibold">
                        {ann.audience === "all" ? "Semua" : ann.audience === "teacher" ? "Guru" : "Siswa"}
                      </span>
                      <span className="text-[11px] text-muted sm:ml-auto">{ann.time}</span>
                    </div>
                    <h3 className="font-display font-bold text-ink text-base leading-snug">{ann.title}</h3>
                    {ann.body && (
                      <p className="text-xs sm:text-sm text-muted leading-relaxed mt-1.5 line-clamp-3">
                        {ann.body}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-line text-[11px] text-muted">
                      <User size={12} aria-hidden="true" />
                      <span className="font-semibold text-ink/70">{ann.author || "Admin"}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  } else {
    // DEFAULT VIEW: BERANDA
    content = (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mb-1">
              Selamat mengajar, {userName.split(" ").slice(1).join(" ")}!
            </h1>
            <p className="text-muted text-sm" suppressHydrationWarning>
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs px-4 py-2 self-start sm:self-auto"
          >
            <Plus size={14} /> Buat Pengumuman
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3.5 mb-6">
        {(() => {
          const hadir = dayRecords.filter((record) => record.status === "Masuk").length;
          const tercatat = dayRecords.filter((record) => record.status).length;
          const stats = [
            {
              label: "Siswa Wali Kelas",
              value: roster.length ? String(roster.length) : "—",
              sub: className ? `Kelas ${className}` : "Belum ada kelas",
              showSkeleton: false,
            },
            {
              label: "Hadir Hari Ini",
              value: String(hadir),
              sub: `${tercatat} dari ${roster.length} tercatat`,
              showSkeleton: attendanceLoading,
            },
            {
              label: "Belum Diabsen",
              value: String(Math.max(roster.length - tercatat, 0)),
              sub: "Lengkapi absensi hari ini",
              showSkeleton: attendanceLoading,
            },
          ];
          return stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card p-4"
            >
              {stat.showSkeleton ? (
                <>
                  <Skeleton className="h-9 w-12" />
                  <div className="text-xs font-semibold text-ink mt-1.5">{stat.label}</div>
                  <Skeleton className="mt-1.5 h-3 w-28" />
                </>
              ) : (
                <>
                  <div className="font-display font-extrabold text-3xl text-brand-green">{stat.value}</div>
                  <div className="text-xs font-semibold text-ink mt-1">{stat.label}</div>
                  <div className="text-[11px] text-muted mt-0.5">{stat.sub}</div>
                </>
              )}
            </motion.div>
          ));
        })()}
      </div>

      {/* Agenda terdekat */}
      <div className="mb-4">
        <UpcomingAgenda onNavigate={onNavigate} />
      </div>

      {/* Pengumuman */}
      <div className="grid gap-4">
        {/* Announcements List */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-brand-green" />
              <h2 className="font-semibold text-ink text-sm">Pengumuman Terkini</h2>
            </div>
          </div>
          <div className="space-y-3">
            {announcements.map((ann, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-xl text-sm border",
                  ann.urgent ? "bg-red-50/60 border-red-100" : "bg-cream border-line"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-semibold text-ink text-xs truncate">{ann.title}</div>
                  {ann.urgent && (
                    <span className="badge bg-red-100 text-red-700 text-[9px] font-bold flex-shrink-0">
                      Penting
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted">{ann.author} · {ann.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div>
      {content}

      {/* Modal: Buat Pengumuman Guru */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Buat Pengumuman Kelas"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Bell size={20} className="text-brand-leaf" />
                  <h3 className="font-display font-bold text-lg text-ink">Buat Pengumuman Kelas</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="btn-icon">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Judul Pengumuman</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Remedial Bab 3 Matematika Peminatan"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Target Kelas</label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                  >
                    <option value="Semua Kelas Ajar">
                      Semua Kelas Ajar{className ? ` (${className})` : ""}
                    </option>
                    {className && (
                      <option value={`Kelas ${className}`}>Kelas {className} Saja</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Isi Instruksi</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tuliskan petunjuk jelas bagi siswa..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="urgentCheck"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="rounded text-brand-leaf focus:ring-brand-leaf"
                  />
                  <label htmlFor="urgentCheck" className="text-xs font-semibold text-ink cursor-pointer">
                    Tandai sebagai pengumuman mendesak / penting
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-outline text-xs"
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn-primary text-xs px-5 py-2">
                    Kirimkan Pengumuman
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
