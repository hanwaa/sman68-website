"use client";

import { motion } from "framer-motion";
import { Award, Bell, ChevronRight, ClipboardCheck, Plus, School, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import UpcomingAgenda from "@/components/dashboard/UpcomingAgenda";
import type {
  StudentAchievement,
  StudentAnnouncement,
  StudentAttendance,
} from "@/components/dashboard/parts/student/types";

const greetings = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
};

type Props = {
  userName: string;
  className?: string;
  today: string;
  attendance: StudentAttendance[];
  announcementList: StudentAnnouncement[];
  achievements: StudentAchievement[];
  onNavigate: (page: string) => void;
  onMarkRead: (id: string) => void;
  onCreateAchievement: () => void;
};

export default function StudentHome({
  userName,
  className,
  today,
  attendance,
  announcementList,
  achievements,
  onNavigate,
  onMarkRead,
  onCreateAchievement,
}: Props) {
  const hadirCount = attendance.filter((a) => a.status === "Masuk").length;
  const attendancePercent =
    attendance.length > 0 ? Math.round((hadirCount / attendance.length) * 100) : null;
  const unreadAnnouncements = announcementList.filter((a) => !a.read).length;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1
          className="font-display font-extrabold text-2xl md:text-3xl text-ink mb-1"
          suppressHydrationWarning
        >
          {greetings()}, {userName.split(" ")[0]}!
        </h1>
        <p className="text-muted text-sm" suppressHydrationWarning>
          {today} · Kelas {className ?? "-"}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { id: "kelas", label: "Kelas Digital", sub: "Materi, tugas & nilai", icon: School },
          {
            id: "absensi",
            label: "Absensi",
            sub:
              attendancePercent === null ? "Rekap kehadiran" : `Kehadiran ${attendancePercent}%`,
            icon: ClipboardCheck,
          },
          {
            id: "pengumuman",
            label: "Pengumuman",
            sub:
              unreadAnnouncements > 0 ? `${unreadAnnouncements} belum dibaca` : "Tidak ada yang baru",
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
              onClick={() => onNavigate(item.id)}
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

      <div className="mb-4">
        <UpcomingAgenda onNavigate={onNavigate} />
      </div>

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
              onClick={() => onMarkRead(ann.id)}
              className={cn(
                "p-3 rounded-xl text-sm cursor-pointer hover:shadow-sm transition-all border",
                ann.isUrgent ? "bg-red-50/50 border-red-100" : "bg-cream border-line"
              )}
            >
              <div className="flex items-start gap-2">
                {ann.isUrgent && (
                  <span className="badge bg-red-100 text-red-700 text-[10px] flex-shrink-0">
                    Mendesak
                  </span>
                )}
                <span className="text-ink text-xs font-medium line-clamp-1 flex-1">{ann.title}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted mt-1.5">
                <span>{ann.time}</span>
                <span>{ann.read ? "Dibaca" : "● Baru"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-brand-leaf" />
            <h2 className="font-semibold text-ink text-sm">Prestasi Terverifikasi</h2>
          </div>
          <button
            onClick={onCreateAchievement}
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
                <div className="text-xs text-muted">
                  {ach.level} · {ach.year}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
