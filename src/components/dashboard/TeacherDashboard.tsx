"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useModalA11y } from "@/lib/useModalA11y";
import { type AbsensiStatus } from "@/lib/absensi";
import UpcomingAgenda from "@/components/dashboard/UpcomingAgenda";
import AttendanceView from "@/components/dashboard/parts/teacher/AttendanceView";
import AnnouncementBoard from "@/components/dashboard/parts/teacher/AnnouncementBoard";
import AnnouncementModal from "@/components/dashboard/parts/teacher/AnnouncementModal";
import { LatestAnnouncements, TeacherKpiCards } from "@/components/dashboard/parts/teacher/TeacherHomeCards";
import type {
  AnnouncementDraft,
  TeacherAnnouncement,
} from "@/components/dashboard/parts/teacher/types";
import {
  apiFetchAttendance,
  apiPushAttendance,
  todayIsoDate,
  type AttendanceApiRecord,
} from "@/lib/attendance-api";

const Classroom = dynamic(() => import("@/components/dashboard/Classroom"), {
  loading: () => <Skeleton className="h-96 w-full" />,
});

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
  const [announcements, setAnnouncements] = useState<TeacherAnnouncement[]>([]);
  const [annFilter, setAnnFilter] = useState<"semua" | "penting" | "saya">("semua");
  const [showModal, setShowModal] = useState(false);
  const modalRef = useModalA11y<HTMLDivElement>(showModal, () => setShowModal(false));

  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(() => todayIsoDate());
  const [dayRecords, setDayRecords] = useState<AttendanceApiRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Daftar siswa wali kelas dari database
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!className) {
        setRoster([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/students?class=${encodeURIComponent(className)}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const payload = (await res.json()) as { data?: { id: string; name: string }[] };
        if (!cancelled && payload.data) setRoster(payload.data);
      } catch {
        /* roster kosong bila API tidak tersedia */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [className]);

  // Rekap absensi per tanggal dari database, ganti tanggal = ganti data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setAttendanceLoading(true);
      const records = await apiFetchAttendance({ date: attendanceDate });
      if (!cancelled) {
        if (records) setDayRecords(records);
        setAttendanceLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [attendanceDate]);

  // Sinkronkan pengumuman guru dari database
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/announcements?audience=teacher", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as { data?: TeacherAnnouncement[] };
        if (!cancelled && payload.data) setAnnouncements(payload.data);
      } catch {
        /* API tidak tersedia, biarkan kosong, tanpa pengumuman demo */
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateAnnouncement = async (draft: AnnouncementDraft) => {
    const newAnn: TeacherAnnouncement = {
      id: "ann-" + Date.now(),
      title: draft.title,
      body: draft.body,
      time: "Baru saja",
      urgent: draft.urgent,
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
          title: draft.title,
          body: draft.body,
          audience: "student",
          urgent: draft.urgent,
          author: userName,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        onShowToast(payload?.error ?? "Gagal menyimpan pengumuman ke server.");
      } else {
        onShowToast(`Pengumuman "${draft.title}" berhasil diterbitkan untuk ${draft.target}!`);
      }
    } catch {
      onShowToast("Pengumuman tersimpan lokal, server tidak terjangkau.");
    }

    setShowModal(false);
  };

  const handleSetStatus = async (studentId: string, name: string, status: AbsensiStatus) => {
    const selectedLabel = new Date(`${attendanceDate}T00:00:00`).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

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

  let content: React.ReactNode;

  if (activePage === "kelas") {
    content = <Classroom role="teacher" userName={userName} onShowToast={onShowToast} />;
  } else if (activePage === "absensi") {
    content = (
      <AttendanceView
        className={className}
        userName={userName}
        roster={roster}
        dayRecords={dayRecords}
        attendanceDate={attendanceDate}
        loading={attendanceLoading}
        onDateChange={setAttendanceDate}
        onSetStatus={handleSetStatus}
      />
    );
  } else if (activePage === "pengumuman") {
    content = (
      <AnnouncementBoard
        announcements={announcements}
        userName={userName}
        filter={annFilter}
        onFilterChange={setAnnFilter}
        onCreate={() => setShowModal(true)}
      />
    );
  } else {
    const hadir = dayRecords.filter((record) => record.status === "Masuk").length;
    const tercatat = dayRecords.filter((record) => record.status).length;

    content = (
      <div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mb-1">
                Selamat mengajar, {userName.split(" ").slice(1).join(" ")}!
              </h1>
              <p className="text-muted text-sm" suppressHydrationWarning>
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
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

        <TeacherKpiCards
          rosterCount={roster.length}
          className={className}
          hadir={hadir}
          tercatat={tercatat}
          loading={attendanceLoading}
        />

        <div className="mb-4">
          <UpcomingAgenda onNavigate={onNavigate} />
        </div>

        <LatestAnnouncements announcements={announcements} />
      </div>
    );
  }

  return (
    <div>
      {content}

      <AnnouncementModal
        open={showModal}
        modalRef={modalRef}
        className={className}
        onSubmit={handleCreateAnnouncement}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
