import type { ElementType } from "react";
import {
  Award,
  Bell,
  BookOpen,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  School,
  Shield,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

export const roles = [
  { id: "student", label: "Siswa", icon: GraduationCap, color: "text-brand-green", badge: "bg-brand-green text-white" },
  { id: "teacher", label: "Guru", icon: BookOpen, color: "text-brand-green", badge: "bg-brand-leaf text-brand-pine font-bold" },
  { id: "admin", label: "Admin", icon: Shield, color: "text-brand-pine", badge: "bg-brand-pine text-white" },
] as const;

export type RoleId = (typeof roles)[number]["id"];

export const navByRole: Record<RoleId, { icon: ElementType; label: string; id: string }[]> = {
  student: [
    { id: "beranda", icon: LayoutDashboard, label: "Beranda" },
    { id: "kelas", icon: School, label: "Kelas Digital" },
    { id: "agenda-sekolah", icon: Calendar, label: "Agenda Sekolah" },
    { id: "absensi", icon: ClipboardCheck, label: "Absensi" },
    { id: "pengumuman", icon: Bell, label: "Pengumuman" },
    { id: "prestasi", icon: Trophy, label: "Prestasi Saya" },
  ],
  teacher: [
    { id: "beranda", icon: LayoutDashboard, label: "Beranda" },
    { id: "kelas", icon: School, label: "Kelas Digital" },
    { id: "agenda-sekolah", icon: Calendar, label: "Agenda Sekolah" },
    { id: "absensi", icon: ClipboardCheck, label: "Absensi Kelas" },
    { id: "pengumuman", icon: Bell, label: "Pengumuman" },
  ],
  admin: [
    { id: "beranda", icon: LayoutDashboard, label: "Ringkasan & Metrik" },
    { id: "agenda-sekolah", icon: Calendar, label: "Agenda Sekolah" },
    { id: "konten", icon: BookOpen, label: "Manajemen Data" },
    { id: "users", icon: Users, label: "Data Pengguna" },
  ],
};

export const ROLE_LABELS: Record<RoleId, string> = {
  student: "Siswa",
  teacher: "Guru",
  admin: "Admin",
};

export type NotifKind = "pengumuman" | "tugas" | "nilai" | "permintaan" | "moderasi" | "akun";

export type DashboardNotification = {
  id: string;
  kind: NotifKind;
  title: string;
  detail: string;
  time: string;
};

export const NOTIF_META: Record<NotifKind, { icon: ElementType; tone: string }> = {
  pengumuman: { icon: Bell, tone: "bg-brand-green/10 text-brand-green" },
  tugas: { icon: ClipboardList, tone: "bg-amber-100 text-amber-700" },
  nilai: { icon: Award, tone: "bg-brand-pine/10 text-brand-pine" },
  permintaan: { icon: UserPlus, tone: "bg-brand-lime/25 text-brand-pine" },
  moderasi: { icon: Shield, tone: "bg-danger-tint text-danger-deep" },
  akun: { icon: Users, tone: "bg-brand-mist text-brand-green" },
};

export const readKeyFor = (username: string) => `sman68_notif_read:${username}`;
export const dismissedKeyFor = (username: string) => `sman68_notif_dismissed:${username}`;
