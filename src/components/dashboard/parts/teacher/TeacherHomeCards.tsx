"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import type { TeacherAnnouncement } from "@/components/dashboard/parts/teacher/types";

type Props = {
  rosterCount: number;
  className?: string;
  hadir: number;
  tercatat: number;
  loading: boolean;
};

type FeedProps = {
  announcements: TeacherAnnouncement[];
};

export function TeacherKpiCards({ rosterCount, className, hadir, tercatat, loading }: Props) {
  const stats = [
    {
      label: "Siswa Wali Kelas",
      value: rosterCount ? String(rosterCount) : "-",
      sub: className ? `Kelas ${className}` : "Belum ada kelas",
      showSkeleton: false,
    },
    {
      label: "Hadir Hari Ini",
      value: String(hadir),
      sub: `${tercatat} dari ${rosterCount} tercatat`,
      showSkeleton: loading,
    },
    {
      label: "Belum Diabsen",
      value: String(Math.max(rosterCount - tercatat, 0)),
      sub: "Lengkapi absensi hari ini",
      showSkeleton: loading,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3.5 mb-6">
      {stats.map((stat, i) => (
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
      ))}
    </div>
  );
}

export function LatestAnnouncements({ announcements }: FeedProps) {
  return (
    <div className="grid gap-4">
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
                ann.urgent ? "bg-danger-tint/60 border-danger/40" : "bg-cream border-line"
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-semibold text-ink text-xs truncate">{ann.title}</div>
                {ann.urgent && (
                  <span className="badge bg-danger-tint text-danger-deep text-[9px] font-bold flex-shrink-0">
                    Penting
                  </span>
                )}
              </div>
              <div className="text-[11px] text-muted">
                {ann.author} · {ann.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
