"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Activity,
  Bell,
  CalendarClock,
  Check,
  Eye,
  FileText,
  GraduationCap,
  Inbox,
  Newspaper,
  Plus,
  RefreshCw,
  Shield,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import UpcomingAgenda from "@/components/dashboard/UpcomingAgenda";
import type { AdminStats, PendingItem } from "@/components/dashboard/parts/admin/types";

const AdminCharts = dynamic(() => import("@/components/dashboard/AdminCharts"), {
  loading: () => (
    <div className="grid lg:grid-cols-3 gap-4 mb-6" aria-hidden="true">
      <Skeleton className="h-80 lg:col-span-2" />
      <Skeleton className="h-80" />
    </div>
  ),
});

type Props = {
  userName: string;
  stats: AdminStats | null;
  updatedAt: Date | null;
  pendingList: PendingItem[];
  moderationLoaded: boolean;
  onRefresh: () => void;
  onCreateNews: () => void;
  onCreateAnnouncement: () => void;
  onNavigate: (page: string) => void;
  onAudit: () => void;
  onApprove: (id: string, title: string, source: string) => void;
  onReject: (id: string, title: string, source: string) => void;
};

export default function AdminHomeView({
  userName,
  stats,
  updatedAt,
  pendingList,
  moderationLoaded,
  onRefresh,
  onCreateNews,
  onCreateAnnouncement,
  onNavigate,
  onAudit,
  onApprove,
  onReject,
}: Props) {
  const weeklyChartData = (stats?.weekly ?? []).map((item) => ({
    name: new Date(`${item.day}T00:00:00`).toLocaleDateString("id-ID", { weekday: "short" }),
    visitors: item.visitors,
    pageviews: item.pageviews,
  }));
  const roleChartData = stats
    ? [
        { role: "Siswa", count: stats.roles.student, fill: "#16794A" },
        { role: "Guru", count: stats.roles.teacher, fill: "#2FA36B" },
        { role: "Admin", count: stats.roles.admin, fill: "#4FBE86" },
      ]
    : [];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mb-1">
              Panel Admin, {userName.split(" ")[0]}!
            </h1>
            <p className="text-muted text-sm">Ringkasan performa dan kontrol portal SMAN 68 Jakarta.</p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1.5 font-semibold text-brand-green">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"
                  aria-hidden="true"
                />
                Realtime
              </span>
              <span aria-live="polite">
                diperbarui {updatedAt ? updatedAt.toLocaleTimeString("id-ID") : "—"}
              </span>
              <button
                onClick={onRefresh}
                className="inline-flex items-center gap-1 font-semibold text-brand-green hover:text-brand-pine"
              >
                <RefreshCw size={11} aria-hidden="true" /> Segarkan
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={onCreateNews} className="btn-primary text-xs px-3.5 py-2">
              <Plus size={14} /> Berita Baru
            </button>
            <button onClick={onCreateAnnouncement} className="btn-ghost text-xs px-3.5 py-2">
              <Bell size={14} /> Siarkan Memo
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        {[
          {
            label: "Pengunjung Hari Ini",
            value: stats ? stats.visitorsToday.toLocaleString("id-ID") : "—",
            sub: stats ? `${stats.pageviewsToday.toLocaleString("id-ID")} halaman dilihat` : "menunggu data",
            icon: Eye,
            tone: "bg-brand-green/10 text-brand-green",
          },
          {
            label: "Pengguna Online",
            value: stats ? stats.onlineSessions.toLocaleString("id-ID") : "—",
            sub: stats
              ? `aktif 5 menit terakhir · ${stats.loginsToday.toLocaleString("id-ID")} login hari ini`
              : "menunggu data",
            icon: Activity,
            tone: "bg-brand-leaf/15 text-brand-green",
          },
          {
            label: "Kehadiran Hari Ini",
            value: stats ? stats.presentToday.toLocaleString("id-ID") : "—",
            sub: stats
              ? `${stats.students > 0 ? Math.round((stats.presentToday / stats.students) * 100) : 0}% dari ${stats.students.toLocaleString("id-ID")} siswa`
              : "menunggu data",
            icon: UserCheck,
            tone: "bg-brand-mist text-brand-pine",
          },
          {
            label: "Perlu Moderasi",
            value: stats ? stats.moderationPending.toLocaleString("id-ID") : "—",
            sub: "konten menunggu tinjauan",
            icon: Inbox,
            tone:
              stats && stats.moderationPending > 0
                ? "bg-red-100 text-red-600"
                : "bg-brand-mist text-brand-pine",
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card p-4 hover:shadow-card transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl ${stat.tone} flex items-center justify-center`}>
                  <Icon size={17} />
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl text-ink tracking-tight tabular-nums">
                {stat.value}
              </div>
              <div className="text-xs text-muted mt-0.5 font-medium">{stat.label}</div>
              <div className="text-[10px] text-muted/80 mt-1">{stat.sub}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Berita Tayang", value: stats?.news, sub: `${stats?.newsDraft ?? 0} draf & pending`, icon: Newspaper },
          { label: "Pengumuman Terbit", value: stats?.announcements, sub: "siswa & guru", icon: Bell },
          { label: "Total Pembaca", value: stats?.pageviewsTotal, sub: `${stats?.pageviewsToday ?? 0} hari ini`, icon: Eye },
          { label: "Agenda Mendatang", value: stats?.eventsUpcoming, sub: "event aktif", icon: CalendarClock },
          { label: "Prestasi Terdata", value: stats?.achievements, sub: `${stats?.achievementsPending ?? 0} menunggu verifikasi`, icon: GraduationCap },
          { label: "Tugas Belum Dinilai", value: stats?.submissionsPending, sub: "kelas digital", icon: FileText },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-3.5">
              <div className="flex items-center gap-2 text-muted">
                <Icon size={13} aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-wide">{stat.label}</span>
              </div>
              <div className="font-display font-extrabold text-xl text-ink mt-1.5 tabular-nums">
                {stat.value === undefined ? "—" : stat.value.toLocaleString("id-ID")}
              </div>
              <div className="text-[10px] text-muted/80 mt-0.5 truncate">{stat.sub}</div>
            </div>
          );
        })}
      </div>

      <AdminCharts weeklyData={weeklyChartData} roleChartData={roleChartData} />

      {stats && stats.topPages.length > 0 && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-ink text-base">Halaman Terpopuler</h2>
            <span className="text-[11px] text-muted">akumulasi kunjungan</span>
          </div>
          <ol className="space-y-2">
            {stats.topPages.slice(0, 5).map((page, index) => (
              <li key={page.path} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-cream border border-line text-[11px] font-bold text-brand-pine flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <a
                  href={page.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 text-xs font-medium text-ink truncate hover:text-brand-green"
                >
                  {page.path}
                </a>
                <span className="text-xs font-semibold text-brand-green tabular-nums">
                  {page.views.toLocaleString("id-ID")}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mb-4">
        <UpcomingAgenda onNavigate={onNavigate} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-brand-green" />
              <h2 className="font-semibold text-ink text-sm">Konten Menunggu Persetujuan</h2>
            </div>
            <span className="badge bg-red-100 text-red-700 text-xs font-bold">
              {moderationLoaded ? `${pendingList.length} Pending` : <Skeleton className="h-4 w-16" />}
            </span>
          </div>

          <div className="space-y-3">
            {pendingList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-cream rounded-xl hover:bg-line/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="badge bg-brand-green/10 text-brand-green text-[10px] flex-shrink-0">
                    {item.type}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">{item.title}</div>
                    <div className="text-xs text-muted">
                      Oleh {item.author} · {item.time}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button
                    onClick={() => onApprove(item.id, item.title, item.source)}
                    className="btn-ghost text-xs gap-1"
                  >
                    <Check size={12} /> Setujui
                  </button>
                  <button
                    onClick={() => onReject(item.id, item.title, item.source)}
                    className="btn-danger text-xs gap-1"
                  >
                    <X size={12} /> Tolak
                  </button>
                </div>
              </div>
            ))}
            {moderationLoaded && pendingList.length === 0 && (
              <div className="py-6 text-center text-sm text-muted">
                Tidak ada konten yang menunggu persetujuan.
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink text-sm mb-3.5">Pintasan Manajemen</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Buat Berita", icon: Newspaper, color: "text-brand-green", onClick: onCreateNews },
              { label: "Siarkan Memo", icon: Bell, color: "text-brand-green", onClick: onCreateAnnouncement },
              { label: "Kelola User", icon: Users, color: "text-brand-green", onClick: () => onNavigate("users") },
              { label: "Audit Sistem", icon: Shield, color: "text-brand-green", onClick: onAudit },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="flex flex-col items-center justify-center p-3.5 bg-cream hover:bg-brand-pine hover:text-white rounded-xl text-center group transition-all"
                >
                  <Icon
                    size={20}
                    className={`${action.color} group-hover:text-brand-leaf mb-1.5 transition-colors`}
                  />
                  <span className="text-xs font-semibold text-ink group-hover:text-white transition-colors leading-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
