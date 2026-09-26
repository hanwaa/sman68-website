"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Plus,
  X,
  FileCheck,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Camera,
  RotateCcw,
  Check,
  School,
  ClipboardCheck,
  ChevronRight,
  Megaphone,
  Pin,
  AlertCircle,
  CheckCheck,
  Inbox,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { achievementPoints, isVerified, levelLabel } from "@/lib/achievement-points";
import { Skeleton } from "@/components/ui/Skeleton";
import { useModalA11y } from "@/lib/useModalA11y";
import {
  absensiSelfieUrl,
  getAbsensiRecords,
  saveAbsensiRecord,
} from "@/lib/absensi";
import {
  apiFetchAttendance,
  apiPushAttendance,
  todayIsoDate,
} from "@/lib/attendance-api";
import { dataUrlToFile, uploadToR2 } from "@/lib/upload";
import UpcomingAgenda from "@/components/dashboard/UpcomingAgenda";

const Classroom = dynamic(() => import("@/components/dashboard/Classroom"), {
  loading: () => <Skeleton className="h-96 w-full" />,
});

const greetings = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

const ACHIEVEMENT_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Menunggu verifikasi", className: "bg-amber-100 text-amber-700" },
  draft: { label: "Verifikasi diterima", className: "bg-brand-green/10 text-brand-green" },
  rejected: { label: "Verifikasi gagal", className: "bg-red-100 text-red-600" },
  published: { label: "Verifikasi diterima", className: "bg-brand-green/10 text-brand-green" },
  approved: { label: "Verifikasi diterima", className: "bg-brand-green/10 text-brand-green" },
};

type AttendanceStatus = "Masuk" | "Izin" | "Sakit" | "Alpa";

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

interface StudentDashboardProps {
  userName: string;
  studentId?: string;
  className?: string;
  activePage?: string;
  onShowToast?: (msg: string) => void;
  onNavigate?: (page: string) => void;
}

export default function StudentDashboard({
  userName,
  studentId,
  className,
  activePage = "beranda",
  onShowToast = () => {},
  onNavigate = () => {},
}: StudentDashboardProps) {
  // State awal dikosongkan agar data demo tidak sempat tampil lalu "hilang"
  // saat data asli dari database selesai dimuat.
  const [achievements, setAchievements] = useState<
    { id: string; title: string; level: string; year: number; category: string; status: string }[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<{
    classes: { className: string; total: number; points: number; rank: number }[];
    students: { name: string; className: string; total: number; points: number }[];
    me: {
      name: string;
      className: string | null;
      total: number;
      points: number;
      classRank: number | null;
      classPoints: number;
      classTotal: number;
    } | null;
  } | null>(null);
  const [announcementList, setAnnouncementList] = useState<
    {
      id: string;
      title: string;
      body: string;
      author: string;
      isPinned: boolean;
      isUrgent: boolean;
      time: string;
      read: boolean;
    }[]
  >([]);
  const [annFilter, setAnnFilter] = useState<"semua" | "baru" | "penting">("semua");
  const [attendance, setAttendance] = useState<{ date: Date; status: AttendanceStatus }[]>([]);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [calMonth, setCalMonth] = useState("");
  const [checkedToday, setCheckedToday] = useState(false);
  const [selfieSrc, setSelfieSrc] = useState<string | null>(null);
  const [checkinTime, setCheckinTime] = useState<string | null>(null);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraRetry, setCameraRetry] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const checkinModalRef = useModalA11y<HTMLDivElement>(checkinOpen, () => setCheckinOpen(false));
  const [showModal, setShowModal] = useState(false);
  const modalRef = useModalA11y<HTMLDivElement>(showModal, () => setShowModal(false));

  // Sinkronkan pengumuman dari Neon
  useEffect(() => {    let cancelled = false;
    fetch("/api/announcements?audience=student", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          payload:
            | {
                data?: {
                  id: string;
                  title: string;
                  body: string;
                  author: string;
                  urgent: boolean;
                  pinned: boolean;
                  time: string;
                }[];
              }
            | null
        ) => {
          if (cancelled || !payload?.data?.length) return;
          setAnnouncementList(
            payload.data.map((item) => ({
              id: item.id,
              title: item.title,
              body: item.body,
              author: item.author,
              isPinned: item.pinned,
              isUrgent: item.urgent,
              time: item.time,
              read: false,
            }))
          );
        }
      )
      .catch(() => {
        /* API tidak tersedia — biarkan kosong, tanpa data demo */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sinkronkan status kehadiran dari Neon (fallback: localStorage)
  useEffect(() => {
    if (!studentId) {
      setAttendanceLoaded(true);
      return;
    }
    let cancelled = false;

    (async () => {
      const records = await apiFetchAttendance({ studentId });
      if (cancelled) return;

      if (records) {
        const mapped = records
          .filter((record) => record.status)
          .map((record) => ({
            date: new Date(`${record.date}T00:00:00`),
            status: record.status as AttendanceStatus,
          }))
          .sort((a, b) => b.date.getTime() - a.date.getTime());
        setAttendance(mapped);
        setAttendanceLoaded(true);

        const todayRecord = records.find((record) => record.date === todayIsoDate());
        if (todayRecord) {
          setCheckedToday(true);
          if (todayRecord.checkInTime) setCheckinTime(todayRecord.checkInTime);
          if (todayRecord.selfieUrl) setSelfieSrc(todayRecord.selfieUrl);
        }
        return;
      }

      const local = getAbsensiRecords().find((r) => r.studentId === studentId && r.status);
      if (local?.status) {
        setAttendance([
          { date: new Date(`${local.iso.slice(0, 10)}T00:00:00`), status: local.status },
        ]);
      }
      setAttendanceLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  // Sinkronkan prestasi pribadi siswa dari Neon
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/achievements?student=${encodeURIComponent(userName)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          payload:
            | {
                data?: {
                  id: string;
                  title: string;
                  level: string;
                  year: number;
                  category: string;
                  status?: string;
                }[];
              }
            | null
        ) => {
          if (cancelled || !payload?.data?.length) return;
          setAchievements(
            payload.data.map((item) => ({
              id: item.id,
              title: item.title,
              level: item.level,
              year: item.year,
              category: item.category,
              status: item.status ?? "pending",
            }))
          );
        }
      )
      .catch(() => {
        /* API tidak tersedia — biarkan kosong, tanpa prestasi demo */
      });
    return () => {
      cancelled = true;
    };
  }, [userName]);

  // Sinkronkan leaderboard prestasi (kelas & siswa)
  useEffect(() => {
    if (activePage !== "prestasi") return;
    let cancelled = false;
    fetch("/api/achievements/leaderboard", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { data?: typeof leaderboard } | null) => {
        if (cancelled || !payload?.data) return;
        setLeaderboard(payload.data);
      })
      .catch(() => {
        /* biarkan kosong bila API tidak tersedia */
      });
    return () => {
      cancelled = true;
    };
  }, [activePage, achievements.length]);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newParticipants, setNewParticipants] = useState("");
  const [newLevel, setNewLevel] = useState("Kota Jakarta");
  const [newCategory, setNewCategory] = useState("Akademik");
  const [newYear, setNewYear] = useState(() => new Date().getFullYear());

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    const participants = newParticipants
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    const newItem = {
      id: "ach-" + Date.now(),
      title: newTitle,
      description: newDescription.trim(),
      participants,
      level: newLevel,
      year: Number(newYear),
      category: newCategory,
      status: "pending",
    };

    setAchievements((prev) => [newItem, ...prev]);
    setNewTitle("");
    setNewDescription("");
    setNewParticipants("");
    setShowModal(false);

    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: userName,
          title: newItem.title,
          description: newDescription.trim(),
          participants,
          level: newLevel.toLowerCase().includes("internasional")
            ? "internasional"
            : newLevel.toLowerCase().includes("nasional")
            ? "nasional"
            : newLevel.toLowerCase().includes("provinsi")
            ? "provinsi"
            : "kota",
          category: newCategory.toLowerCase(),
          year: newItem.year,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        onShowToast(payload?.error ?? `Prestasi "${newTitle}" tersimpan lokal.`);
        return;
      }
      onShowToast(`Prestasi "${newTitle}" berhasil diajukan untuk verifikasi!`);
    } catch {
      onShowToast(`Prestasi "${newTitle}" tersimpan lokal — server tidak terjangkau.`);
    }
  };

  const markAnnouncementRead = (id: string) => {
    setAnnouncementList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
    onShowToast("Pengumuman ditandai sudah dibaca.");
  };

  const handleCheckIn = () => {
    const today = new Date();
    setAttendance((prev) => {
      const exists = prev.some((a) => a.date.toDateString() === today.toDateString());
      if (exists) {
        return prev.map((a) =>
          a.date.toDateString() === today.toDateString()
            ? { ...a, status: "Masuk" as AttendanceStatus }
            : a
        );
      }
      return [...prev, { date: today, status: "Masuk" as AttendanceStatus }].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );
    });
    setCheckedToday(true);
    onShowToast("Presensi hari ini berhasil dicatat. Terima kasih!");
  };

  // Buka kamera saat modal selfie aktif
  useEffect(() => {
    if (!checkinOpen) return;
    setCameraError(null);
    setSelfiePreview(null);
    setCameraReady(false);

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        if (!cancelled) {
          setCameraError(
            "Kamera tidak dapat diakses. Pastikan situs dibuka lewat HTTPS dan izin kamera diizinkan, lalu coba lagi."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [checkinOpen, cameraRetry]);

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 480, 480);
    setSelfiePreview(canvas.toDataURL("image/jpeg", 0.85));
  };

  const submitCheckin = () => {
    if (!selfiePreview) return; // wajib foto
    const now = new Date();
    setSelfieSrc(selfiePreview);
    const timeStr =
      now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }) + " WIB";
    const dateStr = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
    setCheckinTime(`${timeStr} · ${dateStr}`);

    // Simpan lokal sebagai fallback, lalu sinkronkan ke Neon + R2
    const activeStudentId = studentId ?? "";
    saveAbsensiRecord({
      studentId: activeStudentId,
      name: userName,
      kelas: className ?? "",
      time: timeStr,
      iso: now.toISOString(),
      selfieUrl: absensiSelfieUrl(activeStudentId),
      selfieLocal: selfiePreview,
    });

    (async () => {
      if (!activeStudentId) return;
      try {
        const file = dataUrlToFile(selfiePreview, `${activeStudentId}.jpg`);
        const { key } = await uploadToR2(file, "absensi");
        await apiPushAttendance({
          studentId: activeStudentId,
          date: todayIsoDate(),
          selfieKey: key,
          checkInTime: timeStr,
        });
      } catch {
        onShowToast(
          "Foto gagal diunggah ke penyimpanan, tetapi absensi tetap tercatat. Coba lagi bila perlu."
        );
      }
    })();

    setCheckinOpen(false);
    handleCheckIn();
  };

  const handleDownloadCertificate = (ach: {
    id: string;
    title: string;
    level: string;
    year: number;
    category: string;
  }) => {
    const text = [
      "SERTIFIKAT PRESTASI DIGITAL",
      "SMA NEGERI 68 JAKARTA",
      "",
      ach.title,
      `Tingkat: ${ach.level} · Tahun: ${ach.year}`,
      `Kategori: ${ach.category}`,
      "",
      "Dokumen ini adalah contoh unduhan demo.",
      "SMA Negeri 68 Jakarta — Jl. Salemba Raya No.18, Jakarta Pusat",
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sertifikat-${ach.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowToast("Sertifikat digital berhasil diunduh.");
  };

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let content: React.ReactNode;

  // SUB-PAGE: KELAS DIGITAL (Google Classroom style)
  if (activePage === "kelas") {
    content = <Classroom role="student" userName={userName} onShowToast={onShowToast} />;
  } else if (activePage === "absensi") {
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
      d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    content = (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">
              Absensi Saya
            </h1>
            <p className="text-muted text-sm">Semester Gasal · Kelas {className ?? "-"}</p>
          </div>
          <span className="badge bg-brand-green/10 text-brand-green font-semibold self-start sm:self-auto">
            Presensi harian aktif
          </span>
        </div>

        {/* KPI */}
        {!attendanceLoaded ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6" aria-busy="true" aria-live="polite">
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
                className="block h-full rounded-full bg-brand-green transition-all"
                style={{ width: `${persentase}%` }}
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
                <XCircle size={15} className="text-red-500" aria-hidden="true" />
              </span>
            </div>
            <div className="text-xs font-semibold text-ink mt-1">
              Sakit {sakit} · Alpa {alpa}
            </div>
          </div>
        </div>
        )}

        {/* Presensi hari ini */}
        <div className="card p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-brand-green/10 flex items-center justify-center flex-shrink-0">
              {checkedToday && selfieSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selfieSrc} alt="Foto selfie presensi" className="w-full h-full object-cover" />
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
                    : "Sudah terpresensi — terima kasih!"
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
              onClick={() => setCheckinOpen(true)}
              className="btn-primary text-xs px-5 py-2.5 self-start sm:self-auto"
            >
              <Camera size={15} /> Unggah Foto Kehadiran
            </button>
          )}
        </div>

        {/* Kalender kehadiran */}
        <div className="card p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display font-bold text-ink text-base">Kalender Kehadiran</h2>
              <p className="text-xs text-muted">
                {monthLabel(calDate)} · status diisi oleh wali kelas
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge bg-cream text-muted font-semibold">
                {attendanceLoaded ? `${daysThisMonth} hari sekolah` : <Skeleton className="h-4 w-20" />}
              </span>
              <select
                value={calMonthIndex}
                onChange={(e) => setCalMonth(`${calYear}-${e.target.value}`)}
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
                onChange={(e) => setCalMonth(`${e.target.value}-${calMonthIndex}`)}
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
                    record?.status === "Alpa" && "bg-red-500 text-white"
                  )}
                >
                  {day}
                </span>
              );
            })}
          </div>

          <div className="mx-auto mt-4 flex w-full max-w-md flex-wrap items-center gap-4 border-t border-line pt-3 text-[11px] font-semibold text-muted">
            {(["Masuk", "Izin", "Sakit", "Alpa"] as AttendanceStatus[]).map((status) => (
              <span key={status} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    status === "Masuk" && "bg-brand-green",
                    status === "Izin" && "bg-amber-400",
                    status === "Sakit" && "bg-sky-400",
                    status === "Alpa" && "bg-red-500"
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
  } else if (activePage === "pengumuman") {
    const unreadCount = announcementList.filter((a) => !a.read).length;
    const urgentCount = announcementList.filter((a) => a.isUrgent).length;
    const visibleAnnouncements = announcementList.filter((a) =>
      annFilter === "baru" ? !a.read : annFilter === "penting" ? a.isUrgent : true
    );

    content = (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-brand-green">
              <Megaphone size={15} aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Pusat Informasi</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mt-1">
              Pengumuman Siswa
            </h1>
            <p className="text-muted text-sm">Informasi penting terkait akademik dan kesiswaan</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-line px-3 py-1.5 text-[11px] font-semibold text-ink shadow-sm">
              <Inbox size={12} className="text-brand-green" aria-hidden="true" />
              {announcementList.length} pengumuman
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shadow-sm",
                unreadCount > 0
                  ? "bg-brand-green/10 border-brand-leaf/30 text-brand-green"
                  : "bg-white border-line text-muted"
              )}
            >
              {unreadCount} belum dibaca
            </span>
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-700 shadow-sm">
                <AlertCircle size={12} aria-hidden="true" />
                {urgentCount} mendesak
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex gap-2" role="group" aria-label="Filter pengumuman">
            {(
              [
                { id: "semua", label: "Semua" },
                { id: "baru", label: `Belum Dibaca${unreadCount ? ` (${unreadCount})` : ""}` },
                { id: "penting", label: "Mendesak" },
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
          {unreadCount > 0 && (
            <button
              onClick={() => {
                setAnnouncementList((prev) => prev.map((a) => ({ ...a, read: true })));
                onShowToast("Semua pengumuman ditandai sudah dibaca.");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green hover:text-brand-pine"
            >
              <CheckCheck size={14} aria-hidden="true" />
              Tandai semua dibaca
            </button>
          )}
        </div>

        {visibleAnnouncements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-line">
            <div className="w-14 h-14 rounded-2xl bg-cream border border-line flex items-center justify-center mx-auto mb-4">
              <Inbox size={24} className="text-muted" aria-hidden="true" />
            </div>
            <div className="font-semibold text-ink">Tidak ada pengumuman di filter ini</div>
            <div className="text-muted text-sm mt-1">Coba pilih filter lain atau cek kembali nanti.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAnnouncements.map((ann) => (
              <article
                key={ann.id}
                className={cn(
                  "card relative overflow-hidden p-5 transition-all",
                  !ann.read && "border-brand-leaf/40 bg-gradient-to-r from-brand-green/[0.05] via-white to-white"
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 w-1",
                    ann.isUrgent ? "bg-red-500" : ann.isPinned ? "bg-brand-lime" : "bg-brand-green/40"
                  )}
                  aria-hidden="true"
                />
                <div className="flex gap-4">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                      ann.isUrgent
                        ? "bg-red-100 text-red-600"
                        : ann.isPinned
                          ? "bg-brand-lime/25 text-brand-pine"
                          : "bg-brand-green/10 text-brand-green"
                    )}
                    aria-hidden="true"
                  >
                    {ann.isUrgent ? (
                      <AlertCircle size={20} />
                    ) : ann.isPinned ? (
                      <Pin size={20} />
                    ) : (
                      <Megaphone size={20} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      {ann.isUrgent && (
                        <span className="badge bg-red-100 text-red-700 text-[10px] font-bold">Mendesak</span>
                      )}
                      {ann.isPinned && (
                        <span className="badge bg-brand-lime/25 text-brand-pine text-[10px] font-bold inline-flex items-center gap-1">
                          <Pin size={10} aria-hidden="true" /> Disematkan
                        </span>
                      )}
                      {!ann.read && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-brand-green">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" aria-hidden="true" />
                          Baru
                        </span>
                      )}
                      <span className="text-[11px] text-muted sm:ml-auto">{ann.time}</span>
                    </div>
                    <h3 className="font-display font-bold text-ink text-base leading-snug">{ann.title}</h3>
                    {ann.body && (
                      <p className="text-xs sm:text-sm text-muted leading-relaxed mt-1.5 line-clamp-3">
                        {ann.body}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3 border-t border-line">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                        <User size={12} aria-hidden="true" />
                        {ann.author || "Tata Usaha"}
                      </span>
                      {ann.read ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                          <Check size={13} aria-hidden="true" /> Terbaca
                        </span>
                      ) : (
                        <button
                          onClick={() => markAnnouncementRead(ann.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 text-brand-green text-[11px] font-bold px-3 py-1.5 hover:bg-brand-green hover:text-white transition-colors"
                        >
                          <Check size={13} aria-hidden="true" /> Tandai dibaca
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  } else if (activePage === "prestasi") {
    content = (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">
              Portofolio Prestasi Saya
            </h1>
            <p className="text-muted text-sm">Daftar rekognisi dan penghargaan resmi yang diraih</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs px-4 py-2.5 self-start sm:self-auto"
          >
            <Plus size={15} /> Ajukan Prestasi Baru
          </button>
        </div>

        {/* Ringkasan poin & peringkat */}
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Poin Saya</div>
              <div className="font-display font-extrabold text-2xl text-ink">{leaderboard?.me?.points ?? 0}</div>
              <div className="text-[11px] text-muted">{leaderboard?.me?.total ?? 0} prestasi terverifikasi</div>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-lime/30 text-brand-pine flex items-center justify-center flex-shrink-0">
              <Medal size={24} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Peringkat Kelas</div>
              <div className="font-display font-extrabold text-2xl text-ink">
                {leaderboard?.me?.classRank ? `#${leaderboard.me.classRank}` : "-"}
              </div>
              <div className="text-[11px] text-muted">Kelas {leaderboard?.me?.className ?? className ?? "-"}</div>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-pine/10 text-brand-pine flex items-center justify-center flex-shrink-0">
              <Trophy size={24} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Poin Kelas</div>
              <div className="font-display font-extrabold text-2xl text-ink">{leaderboard?.me?.classPoints ?? 0}</div>
              <div className="text-[11px] text-muted">{leaderboard?.me?.classTotal ?? 0} prestasi kelas</div>
            </div>
          </div>
        </div>

        {/* Leaderboard kelas & siswa */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-line">
              <Medal size={16} className="text-brand-green" />
              <h2 className="font-semibold text-ink text-sm">Klasemen Prestasi per Kelas</h2>
            </div>
            {(leaderboard?.classes?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted">Belum ada prestasi terverifikasi. Jadilah yang pertama!</p>
            ) : (
              <ol className="space-y-2.5">
                {leaderboard!.classes.map((cls) => {
                  const max = leaderboard!.classes[0]?.points || 1;
                  const isMine = cls.className === (leaderboard?.me?.className ?? className);
                  return (
                    <li
                      key={cls.className}
                      className={cn("rounded-xl px-3 py-2", isMine && "bg-brand-lime/20 ring-1 ring-brand-lime")}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-2 font-semibold text-ink">
                          <span className={cn("w-5 text-center", cls.rank <= 3 && "text-brand-green")}>#{cls.rank}</span>
                          {cls.className}
                          {isMine && <span className="badge bg-brand-pine text-white text-[9px]">Kelasmu</span>}
                        </span>
                        <span className="text-muted font-semibold">
                          {cls.points} poin · {cls.total} prestasi
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-line overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand-green"
                          style={{ width: `${Math.round((cls.points / max) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-line">
              <Crown size={16} className="text-brand-green" />
              <h2 className="font-semibold text-ink text-sm">Top 10 Siswa Berprestasi</h2>
            </div>
            {(leaderboard?.students?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted">Belum ada data siswa berprestasi.</p>
            ) : (
              <ol className="space-y-2">
                {leaderboard!.students.map((student, index) => (
                  <li key={`${student.className}-${student.name}`} className="flex items-center gap-3 text-xs">
                    <span
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center font-bold flex-shrink-0",
                        index === 0 ? "bg-brand-lime text-brand-pine" : "bg-cream text-muted"
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="flex-1 min-w-0 truncate font-semibold text-ink">{student.name}</span>
                    <span className="text-muted flex-shrink-0">{student.className}</span>
                    <span className="font-bold text-brand-green flex-shrink-0">{student.points}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {achievements.map((ach) => {
            const status = ACHIEVEMENT_STATUS[ach.status ?? "pending"] ?? ACHIEVEMENT_STATUS.pending;
            return (
              <div key={ach.id} className="card p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
                  <Trophy size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="badge bg-brand-green/10 text-brand-green text-[10px]">{levelLabel(ach.level)}</span>
                    <span className="text-xs text-muted">{ach.year}</span>
                    <span className={cn("badge text-[10px] font-semibold", status.className)}>
                      {status.label}
                    </span>
                    {isVerified(ach.status) && (
                      <span className="badge bg-brand-lime/40 text-brand-pine text-[10px] font-bold">
                        +{achievementPoints(ach.level)} poin
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-ink text-sm leading-snug mb-1">{ach.title}</h3>
                  <div className="text-xs text-muted">{ach.category}</div>
                  {isVerified(ach.status) && (
                    <button
                      onClick={() => handleDownloadCertificate(ach)}
                      className="mt-3 text-xs font-semibold text-brand-green hover:underline flex items-center gap-1"
                    >
                      <FileCheck size={13} /> Unduh Sertifikat
                    </button>
                  )}
                  {ach.status === "pending" && (
                    <p className="mt-3 text-[11px] text-muted">
                      Menunggu verifikasi wali kelas/admin. Kamu akan melihat perubahan status di sini.
                    </p>
                  )}
                  {ach.status === "rejected" && (
                    <p className="mt-3 text-[11px] text-muted">
                      Verifikasi gagal — periksa kembali data/bukti prestasi lalu ajukan ulang.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
  // DEFAULT VIEW: BERANDA
  const hadirCount = attendance.filter((a) => a.status === "Masuk").length;
  const attendancePercent =
    attendance.length > 0 ? Math.round((hadirCount / attendance.length) * 100) : null;
  const unreadAnnouncements = announcementList.filter((a) => !a.read).length;

  content = (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mb-1" suppressHydrationWarning>
          {greetings()}, {userName.split(" ")[0]}!
        </h1>
        <p className="text-muted text-sm" suppressHydrationWarning>
          {today} · Kelas {className ?? "-"}
        </p>
      </motion.div>

      {/* Akses cepat */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          {
            id: "kelas",
            label: "Kelas Digital",
            sub: "Materi, tugas & nilai",
            icon: School,
          },
          {
            id: "absensi",
            label: "Absensi",
            sub:
              attendancePercent === null
                ? "Rekap kehadiran"
                : `Kehadiran ${attendancePercent}%`,
            icon: ClipboardCheck,
          },
          {
            id: "pengumuman",
            label: "Pengumuman",
            sub:
              unreadAnnouncements > 0
                ? `${unreadAnnouncements} belum dibaca`
                : "Tidak ada yang baru",
            icon: Bell,
          },
          {
            id: "prestasi",
            label: "Prestasi Saya",
            sub: `${achievements.length} prestasi tercatat`,
            icon: Trophy,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className="card group flex items-center gap-3 p-3.5 text-left transition-all hover:border-brand-leaf/40 hover:shadow-card-hover"
            >
              <span className="w-9 h-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-ink truncate">{item.label}</span>
                <span className="block text-[10px] text-muted truncate">{item.sub}</span>
              </span>
              <ChevronRight
                size={14}
                className="text-muted/50 group-hover:text-brand-green transition-colors"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {/* Agenda terdekat */}
      <div className="mb-4">
        <UpcomingAgenda onNavigate={onNavigate} />
      </div>

      {/* Announcements Preview */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-brand-green" />
            <h2 className="font-semibold text-ink text-sm">Pengumuman Penting</h2>
          </div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {announcementList.slice(0, 4).map((ann) => (
              <div
                key={ann.id}
                onClick={() => markAnnouncementRead(ann.id)}
                className={cn(
                  "p-3 rounded-xl text-sm cursor-pointer hover:shadow-sm transition-all border",
                  ann.isUrgent
                    ? "bg-red-50/50 border-red-100"
                    : "bg-cream border-line"
                )}
              >
                <div className="flex items-start gap-2">
                  {ann.isUrgent && (
                    <span className="badge bg-red-100 text-red-700 text-[10px] flex-shrink-0">
                      Mendesak
                    </span>
                  )}
                  <span className="text-ink text-xs font-medium line-clamp-1 flex-1">
                    {ann.title}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted mt-1.5">
                  <span>{ann.time}</span>
                  <span>{ann.read ? "Dibaca" : "● Baru"}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Achievement Section */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-brand-leaf" />
            <h2 className="font-semibold text-ink text-sm">Prestasi Terverifikasi</h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold text-brand-green hover:text-brand-pine flex items-center gap-1"
          >
            <Plus size={13} /> Tambah Prestasi
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="flex items-center gap-3.5 p-3.5 bg-brand-leaf/5 rounded-xl border border-brand-leaf/20"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-leaf/20 flex items-center justify-center flex-shrink-0 text-brand-leaf">
                <Award size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{ach.title}</div>
                <div className="text-xs text-muted">{ach.level} · {ach.year}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    );
  }

  return (
    <div>
      {content}

      {/* Modal: Tambah Prestasi */}
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
              aria-label="Ajukan Prestasi Baru"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Trophy size={20} className="text-brand-leaf" />
                  <h3 className="font-display font-bold text-lg text-ink">Ajukan Prestasi Baru</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-cream text-muted">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddAchievement} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Nama Prestasi / Kejuaraan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Juara 1 Lomba Desain Web Nasional"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Deskripsi Prestasi</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Ceritakan singkat: ajangnya apa, tingkat apa, dan pencapaianmu..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Tingkat</label>
                    <select
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    >
                      <option value="Kota Jakarta">Tingkat Kota</option>
                      <option value="Provinsi DKI">Tingkat Provinsi</option>
                      <option value="Nasional">Tingkat Nasional</option>
                      <option value="Internasional">Internasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Tahun</label>
                    <input
                      type="number"
                      value={newYear}
                      onChange={(e) => setNewYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  >
                    <option value="Akademik">Akademik & Sains</option>
                    <option value="Olahraga">Olahraga</option>
                    <option value="Seni & Budaya">Seni & Budaya</option>
                    <option value="Teknologi">Teknologi & Robotika</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Nama Peserta (opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bima Putra, Sari Dewi"
                    value={newParticipants}
                    onChange={(e) => setNewParticipants(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                  <p className="text-[10px] text-muted mt-1">Pisahkan dengan koma bila lebih dari satu.</p>
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
                    Kirim untuk Verifikasi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Selfie Presensi */}
      <AnimatePresence>
        {checkinOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckinOpen(false)}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={checkinModalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Presensi Selfie"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Camera size={20} className="text-brand-leaf" />
                  <h3 className="font-display font-bold text-lg text-ink">Presensi Selfie</h3>
                </div>
                <button
                  onClick={() => setCheckinOpen(false)}
className="btn-icon"
                  aria-label="Tutup presensi selfie"
                >
                  <X size={18} />
                </button>
              </div>

              {selfiePreview ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selfiePreview}
                    alt="Pratinjau foto selfie presensi"
                    className="w-full aspect-square rounded-xl object-cover border border-line"
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setSelfiePreview(null)}
                      className="btn-outline flex-1 text-xs"
                    >
                      <RotateCcw size={14} aria-hidden="true" /> Ulangi
                    </button>
                    <button
                      onClick={submitCheckin}
                      className="btn-primary flex-1 text-xs"
                    >
                      <Check size={14} aria-hidden="true" /> Kirim Presensi
                    </button>
                  </div>
                </div>
              ) : cameraError ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-xl bg-cream border border-line flex items-center justify-center mx-auto mb-3">
                    <Camera size={24} className="text-muted" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted leading-relaxed mb-5">{cameraError}</p>
                  <button
                    onClick={() => setCameraRetry((c) => c + 1)}
                    className="btn-primary text-xs px-5 py-2.5"
                  >
                    <RotateCcw size={15} /> Coba Lagi
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-brand-pine">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      onLoadedMetadata={() => setCameraReady(true)}
                      className="w-full h-full object-cover"
                      aria-label="Kamera selfie"
                    />
                  </div>
                  <p className="text-xs text-muted text-center mt-3">
                    {cameraReady
                      ? "Posisikan wajah di dalam bingkai, lalu ambil foto."
                      : "Menyalakan kamera..."}
                  </p>
                  <button
                    onClick={captureSelfie}
                    disabled={!cameraReady}
                    className="btn-primary w-full text-xs py-2.5 mt-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Camera size={15} /> Ambil Foto
                  </button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
