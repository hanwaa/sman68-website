"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import { useModalA11y } from "@/lib/useModalA11y";
import { absensiSelfieUrl, getAbsensiRecords, saveAbsensiRecord } from "@/lib/absensi";
import { apiFetchAttendance, apiPushAttendance, todayIsoDate } from "@/lib/attendance-api";
import { uploadDataUrlResilient } from "@/lib/upload";
import StudentHome from "@/components/dashboard/parts/student/StudentHome";
import AttendanceHistory from "@/components/dashboard/parts/student/AttendanceHistory";
import StudentAnnouncements from "@/components/dashboard/parts/student/StudentAnnouncements";
import AchievementPortfolio from "@/components/dashboard/parts/student/AchievementPortfolio";
import AddAchievementModal, {
  type AchievementDraft,
} from "@/components/dashboard/parts/student/AddAchievementModal";
import CheckinModal from "@/components/dashboard/parts/student/CheckinModal";
import LegalisirView from "@/components/dashboard/parts/student/LegalisirView";
import type {
  StudentAchievement,
  StudentAnnouncement,
  StudentAttendance,
  StudentLeaderboard,
} from "@/components/dashboard/parts/student/types";

const Classroom = dynamic(() => import("@/components/dashboard/Classroom"), {
  loading: () => <Skeleton className="h-96 w-full" />,
});

type AttendanceStatus = StudentAttendance["status"];

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
  const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<StudentLeaderboard | null>(null);
  const [announcementList, setAnnouncementList] = useState<StudentAnnouncement[]>([]);
  const [annFilter, setAnnFilter] = useState<"semua" | "baru" | "penting">("semua");
  const [attendance, setAttendance] = useState<StudentAttendance[]>([]);
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

  // Sinkronkan pengumuman dari database
  useEffect(() => {
    let cancelled = false;
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
        /* API tidak tersedia, biarkan kosong, tanpa data demo */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sinkronkan status kehadiran dari database (fallback: localStorage)
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

  // Sinkronkan prestasi pribadi siswa dari database
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
        /* API tidak tersedia, biarkan kosong, tanpa prestasi demo */
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
      .then((payload: { data?: StudentLeaderboard | null } | null) => {
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

  const handleAddAchievement = async (draft: AchievementDraft) => {
    const rawParticipants = (draft as { participants?: string }).participants ?? "";
    const participants = rawParticipants
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    const newItem = {
      id: "ach-" + Date.now(),
      title: draft.title,
      description: (draft.description ?? "").trim(),
      participants,
      level: draft.level,
      year: Number(draft.year),
      category: draft.category,
      status: "pending",
    };

    setAchievements((prev) => [newItem as StudentAchievement, ...prev]);

    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: userName,
          title: newItem.title,
          description: newItem.description,
          participants,
          level: newItem.level.toLowerCase().includes("internasional")
            ? "internasional"
            : newItem.level.toLowerCase().includes("nasional")
              ? "nasional"
              : newItem.level.toLowerCase().includes("provinsi")
                ? "provinsi"
                : "kota",
          category: newItem.category.toLowerCase(),
          year: newItem.year,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        onShowToast(payload?.error ?? `Prestasi "${newItem.title}" tersimpan lokal.`);
        return;
      }
      onShowToast(`Prestasi "${newItem.title}" berhasil diajukan untuk verifikasi!`);
    } catch {
      onShowToast(`Prestasi "${newItem.title}" tersimpan lokal, server tidak terjangkau.`);
    }
  };

  const markAnnouncementRead = (id: string) => {
    setAnnouncementList((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    onShowToast("Pengumuman ditandai sudah dibaca.");
  };

  const markAllAnnouncementsRead = () => {
    setAnnouncementList((prev) => prev.map((a) => ({ ...a, read: true })));
    onShowToast("Semua pengumuman ditandai sudah dibaca.");
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

    // Simpan lokal sebagai fallback, lalu sinkronkan ke database + R2
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
        const { key } = await uploadDataUrlResilient(selfiePreview, `${activeStudentId}.jpg`, "absensi");
        await apiPushAttendance({
          studentId: activeStudentId,
          date: todayIsoDate(),
          selfieKey: key,
          checkInTime: timeStr,
        });
      } catch (error) {
        onShowToast(
          error instanceof Error
            ? `Foto gagal disimpan: ${error.message}`
            : "Foto gagal disimpan. Coba lagi."
        );
      }
    })();

    setCheckinOpen(false);
    handleCheckIn();
  };

  const handleDownloadCertificate = (ach: StudentAchievement) => {
    const text = [
      "SERTIFIKAT PRESTASI DIGITAL",
      "SMA NEGERI 68 JAKARTA",
      "",
      ach.title,
      `Tingkat: ${ach.level} · Tahun: ${ach.year}`,
      `Kategori: ${ach.category}`,
      "",
      "Dokumen ini adalah contoh unduhan demo.",
      "SMA Negeri 68 Jakarta, Jl. Salemba Raya No.18, Jakarta Pusat",
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

  if (activePage === "kelas") {
    content = <Classroom role="student" userName={userName} onShowToast={onShowToast} />;
  } else if (activePage === "absensi") {
    content = (
      <AttendanceHistory
        className={className}
        attendance={attendance}
        loaded={attendanceLoaded}
        checkedToday={checkedToday}
        selfieSrc={selfieSrc}
        checkinTime={checkinTime ?? ""}
        calMonth={calMonth}
        onCalMonthChange={setCalMonth}
        onOpenCheckin={() => setCheckinOpen(true)}
      />
    );
  } else if (activePage === "pengumuman") {
    content = (
      <StudentAnnouncements
        announcements={announcementList}
        filter={annFilter}
        onFilterChange={setAnnFilter}
        onMarkRead={markAnnouncementRead}
        onMarkAllRead={markAllAnnouncementsRead}
      />
    );
  } else if (activePage === "prestasi") {
    content = (
      <AchievementPortfolio
        className={className}
        achievements={achievements}
        leaderboard={leaderboard}
        onCreate={() => setShowModal(true)}
        onDownloadCertificate={handleDownloadCertificate}
      />
    );
  } else if (activePage === "legalisir") {
    content = <LegalisirView className={className} onShowToast={onShowToast} />;
  } else {
    content = (
      <StudentHome
        userName={userName}
        className={className}
        today={today}
        attendance={attendance}
        announcementList={announcementList}
        achievements={achievements}
        onNavigate={onNavigate}
        onMarkRead={markAnnouncementRead}
        onCreateAchievement={() => setShowModal(true)}
      />
    );
  }

  return (
    <div>
      {content}

      <AddAchievementModal
        open={showModal}
        modalRef={modalRef}
        onSubmit={handleAddAchievement}
        onClose={() => setShowModal(false)}
      />

      <CheckinModal
        open={checkinOpen}
        modalRef={checkinModalRef}
        videoRef={videoRef}
        canvasRef={canvasRef}
        selfiePreview={selfiePreview}
        cameraError={cameraError}
        cameraReady={cameraReady}
        onClose={() => setCheckinOpen(false)}
        onRetake={() => setSelfiePreview(null)}
        onCameraReady={() => setCameraReady(true)}
        onRetryCamera={() => setCameraRetry((c) => c + 1)}
        onCapture={captureSelfie}
        onSubmit={submitCheckin}
      />
    </div>
  );
}
