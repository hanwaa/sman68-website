"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Bell,
  Trophy,
  Users,
  Settings,
  LogOut,
  GraduationCap,
  Shield,
  Menu,
  X,
  Check,
  ChevronRight,
  Sliders,
  ClipboardCheck,
  ClipboardList,
  Award,
  UserPlus,
  Trash2,
  School,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionAccount } from "@/lib/auth";
import { useModalA11y } from "@/lib/useModalA11y";
import { Skeleton } from "@/components/ui/Skeleton";

function PanelSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-8 w-56" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

const StudentDashboard = dynamic(() => import("@/components/dashboard/StudentDashboard"), {
  loading: () => <PanelSkeleton />,
});
const TeacherDashboard = dynamic(() => import("@/components/dashboard/TeacherDashboard"), {
  loading: () => <PanelSkeleton />,
});
const AdminDashboard = dynamic(() => import("@/components/dashboard/AdminDashboard"), {
  loading: () => <PanelSkeleton />,
});
const SchoolAgenda = dynamic(() => import("@/components/dashboard/SchoolAgenda"), {
  loading: () => <PanelSkeleton />,
});
const AdminAgendaManager = dynamic(() => import("@/components/dashboard/AdminAgendaManager"), {
  loading: () => <PanelSkeleton />,
});

const roles = [
  { id: "student", label: "Siswa", icon: GraduationCap, color: "text-brand-green", badge: "bg-brand-green text-white" },
  { id: "teacher", label: "Guru", icon: BookOpen, color: "text-brand-green", badge: "bg-brand-leaf text-brand-pine font-bold" },
  { id: "admin", label: "Admin", icon: Shield, color: "text-brand-pine", badge: "bg-brand-pine text-white" },
] as const;

type RoleId = (typeof roles)[number]["id"];

const navByRole: Record<RoleId, { icon: React.ElementType; label: string; id: string }[]> = {
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

const ROLE_LABELS: Record<RoleId, string> = {
  student: "Siswa",
  teacher: "Guru",
  admin: "Admin",
};

type NotifKind = "pengumuman" | "tugas" | "nilai" | "permintaan" | "moderasi" | "akun";

type DashboardNotification = {
  id: string;
  kind: NotifKind;
  title: string;
  detail: string;
  time: string;
};

const NOTIF_META: Record<NotifKind, { icon: React.ElementType; tone: string }> = {
  pengumuman: { icon: Bell, tone: "bg-brand-green/10 text-brand-green" },
  tugas: { icon: ClipboardList, tone: "bg-amber-100 text-amber-700" },
  nilai: { icon: Award, tone: "bg-brand-pine/10 text-brand-pine" },
  permintaan: { icon: UserPlus, tone: "bg-brand-lime/25 text-brand-pine" },
  moderasi: { icon: Shield, tone: "bg-red-100 text-red-600" },
  akun: { icon: Users, tone: "bg-brand-mist text-brand-green" },
};

const readKeyFor = (username: string) => `sman68_notif_read:${username}`;
const dismissedKeyFor = (username: string) => `sman68_notif_dismissed:${username}`;

export default function DashboardView({ account }: { account: SessionAccount }) {
  const activeRole: RoleId = account.role;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activePage, setActivePage] = useState("beranda");

  // Sidebar otomatis tertutup di layar kecil, terbuka di desktop.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      setIsMobile(!query.matches);
      setSidebarOpen(query.matches);
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const navigateTo = (page: string) => {
    setActivePage(page);
    if (isMobile) setSidebarOpen(false);
  };

  // Notifications Popover & Settings Modal
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [notifLoaded, setNotifLoaded] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsModalRef = useModalA11y<HTMLDivElement>(settingsOpen, () => setSettingsOpen(false));

  // Settings State
  const [userNameState, setUserNameState] = useState(account.name);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  // Toast System
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const visibleNotifications = notifications.filter((n) => !dismissedIds.includes(n.id));

  const persistIds = (key: string, ids: string[], setter: (next: string[]) => void) => {
    setter(ids);
    try {
      localStorage.setItem(key, JSON.stringify(ids.slice(-500)));
    } catch {
      /* penyimpanan lokal tidak tersedia */
    }
  };

  const persistReadIds = (ids: string[]) =>
    persistIds(readKeyFor(account.username), ids, setReadIds);
  const persistDismissedIds = (ids: string[]) =>
    persistIds(dismissedKeyFor(account.username), ids, setDismissedIds);

  const markNotifRead = (id: string) => {
    if (readIds.includes(id)) return;
    persistReadIds([...readIds, id]);
  };

  const markAllNotifsRead = () => {
    persistReadIds([
      ...new Set([...readIds, ...visibleNotifications.map((n) => n.id)]),
    ]);
    showToast("Semua notifikasi ditandai telah dibaca.");
  };

  const dismissNotif = (id: string) => {
    if (dismissedIds.includes(id)) return;
    persistDismissedIds([...new Set([...dismissedIds, id])]);
  };

  const clearAllNotifs = () => {
    persistDismissedIds([
      ...new Set([...dismissedIds, ...visibleNotifications.map((n) => n.id)]),
    ]);
    showToast("Semua notifikasi dihapus.");
  };

  // Muat status baca & daftar yang dihapus dari browser
  useEffect(() => {
    try {
      const rawRead = localStorage.getItem(readKeyFor(account.username));
      if (rawRead) setReadIds(JSON.parse(rawRead) as string[]);
      const rawDismissed = localStorage.getItem(dismissedKeyFor(account.username));
      if (rawDismissed) setDismissedIds(JSON.parse(rawDismissed) as string[]);
    } catch {
      /* abaikan */
    }
  }, [account.username]);

  // Notifikasi live: muat saat mount lalu segarkan tiap 60 detik.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const payload = (await res.json()) as { data?: DashboardNotification[] };
        if (!cancelled && payload.data) setNotifications(payload.data);
      } catch {
        /* pertahankan data terakhir */
      } finally {
        if (!cancelled) setNotifLoaded(true);
      }
    };
    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsOpen(false);
    showToast("Pengaturan profil & preferensi berhasil disimpan!");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* tetap lanjut keluar */
    }
    // Navigasi keras agar tidak ada sisa data akun sebelumnya di cache klien.
    window.location.assign("/login");
  };

  const user = {
    name: account.name,
    subtitle: account.detail || `${ROLE_LABELS[activeRole]} SMAN 68 Jakarta`,
  };
  const navItems = navByRole[activeRole] || [];
  const unreadCount = visibleNotifications.filter((n) => !readIds.includes(n.id)).length;
  const currentRoleMeta = roles.find((r) => r.id === activeRole);

  return (
    <div className="min-h-screen bg-cream flex flex-col font-body text-ink">
      {/* Clean Top Navbar */}
      <header className="bg-brand-pine text-white h-16 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 fixed top-0 left-0 right-0 z-50 border-b border-white/10">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="btn-icon-dark"
          aria-label={sidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Brand Logo */}
        <Link href="/" className="flex items-center group flex-shrink-0" aria-label="SMAN 68 Jakarta - Beranda">
          <div className="relative w-10 h-10 flex-shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src="/assets/logo.png"
              alt="Logo SMAN 68 Jakarta"
              fill
              className="object-contain"
              sizes="40px"
            />
          </div>
        </Link>

        {/* Breadcrumb & Role Badge Indicator */}
        <div className="flex-1 flex items-center gap-2.5 ml-2 sm:ml-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-white/80">
            <span>Dashboard</span>
            <span className="text-white/30">/</span>
            <span className="text-white/95 font-medium">{user.subtitle.split("·")[0].trim()}</span>
          </div>

          <span className={cn("badge text-[10px] py-0.5 px-2.5 shadow-sm", currentRoleMeta?.badge)}>
            {currentRoleMeta?.label}
          </span>
        </div>

        {/* Right Section: Notifications */}
        <div className="flex items-center gap-2.5 relative">
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="btn-icon-dark relative"
              aria-label="Pusat Notifikasi"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-leaf rounded-full ring-2 ring-brand-pine" />
              )}
            </button>

            {/* Notification Popover Dropdown */}
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2.5rem))] sm:w-96 bg-white rounded-xl shadow-card border border-line overflow-hidden z-50 text-ink"
                >
                  <div className="p-3.5 bg-brand-pine text-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Bell size={16} className="text-brand-leaf" />
                      <span className="font-semibold text-sm">Pusat Notifikasi</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotifsRead}
                          className="text-[11px] text-brand-green hover:underline font-semibold"
                        >
                          Tandai Dibaca
                        </button>
                      )}
                      {visibleNotifications.length > 0 && (
                        <button
                          onClick={clearAllNotifs}
                          className="inline-flex items-center gap-1 text-[11px] text-white/70 hover:text-white font-semibold"
                        >
                          <Trash2 size={11} aria-hidden="true" /> Hapus Semua
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-line max-h-72 overflow-y-auto">
                    {!notifLoaded ? (
                      <div className="p-4 space-y-2">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="h-11 animate-pulse rounded-xl bg-line/60" aria-hidden="true" />
                        ))}
                      </div>
                    ) : visibleNotifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <div className="w-10 h-10 rounded-xl bg-cream border border-line flex items-center justify-center mx-auto mb-2">
                          <Bell size={16} className="text-muted" aria-hidden="true" />
                        </div>
                        <div className="text-xs font-semibold text-ink">Belum ada notifikasi</div>
                        <div className="text-[10px] text-muted mt-0.5">
                          Info baru akan muncul otomatis di sini.
                        </div>
                      </div>
                    ) : (
                      visibleNotifications.map((n) => {
                        const meta = NOTIF_META[n.kind] ?? NOTIF_META.pengumuman;
                        const Icon = meta.icon;
                        const unread = !readIds.includes(n.id);
                        return (
                          <div
                            key={n.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => markNotifRead(n.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                markNotifRead(n.id);
                              }
                            }}
                            className={cn(
                              "group relative w-full cursor-pointer p-3 pr-9 text-left text-xs transition-colors hover:bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40",
                              unread && "bg-brand-green/5"
                            )}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={cn(
                                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                                  meta.tone
                                )}
                                aria-hidden="true"
                              >
                                <Icon size={14} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "block text-ink leading-snug",
                                    unread && "font-semibold"
                                  )}
                                >
                                  {n.title}
                                </span>
                                {n.detail && (
                                  <span className="block text-[10px] text-muted mt-0.5 line-clamp-2">
                                    {n.detail}
                                  </span>
                                )}
                                <span className="block text-[10px] text-muted mt-1">{n.time}</span>
                              </span>
                              {unread && (
                                <span
                                  className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0 mt-1.5"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotif(n.id);
                              }}
                              className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-md text-muted opacity-70 transition-colors hover:bg-red-50 hover:text-red-600 hover:opacity-100"
                              aria-label={`Hapus notifikasi: ${n.title}`}
                              title="Hapus notifikasi"
                            >
                              <X size={12} aria-hidden="true" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-2.5 bg-cream text-center border-t border-line">
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-semibold text-brand-green hover:underline"
                    >
                      Tutup
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex pt-16 flex-1 relative">
        {/* Sidebar Navigation */}
        <motion.aside
          initial={false}
          animate={{
            width: sidebarOpen ? 240 : 0,
            opacity: sidebarOpen ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="fixed left-0 top-16 bottom-0 bg-white border-r border-line z-40 overflow-hidden flex-shrink-0 shadow-sm"
          aria-label="Sidebar navigasi"
        >
          <div className="w-[240px] flex flex-col h-full">
            {/* User Profile Card in Sidebar */}
            <div className="p-4 border-b border-line bg-cream/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-pine text-brand-leaf flex items-center justify-center font-display font-extrabold text-sm flex-shrink-0 shadow-sm">
                  {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-ink text-sm truncate">{userNameState || user.name}</div>
                  <div className="text-[11px] text-muted truncate mt-0.5">{user.subtitle}</div>
                </div>
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Menu dashboard">
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-3 mb-2">
                Menu Utama
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isCurrent = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                      isCurrent
                        ? "bg-brand-pine text-white"
                        : "text-ink/70 hover:bg-cream hover:text-ink"
                    )}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={isCurrent ? "text-brand-leaf" : "text-muted"} />
                      <span>{item.label}</span>
                    </div>
                    {isCurrent && <ChevronRight size={14} className="text-white/60" />}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-line space-y-1 bg-cream/40">
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-white hover:text-ink transition-all"
              >
                <Settings size={15} />
                Pengaturan Akun
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-cream hover:text-ink transition-all text-left"
              >
                <LogOut size={15} />
                Keluar Akun
              </button>
            </div>
          </div>
        </motion.aside>

        {/* Backdrop sidebar di mobile */}
        {sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 top-16 z-30 bg-brand-pine/50 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Content Area */}
        <main
          id="main-content"
          className="flex-1 min-w-0 overflow-x-hidden transition-all duration-200 min-h-[calc(100vh-4rem)]"
          style={{ marginLeft: !isMobile && sidebarOpen ? 240 : 0 }}
        >
          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            <h1 className="sr-only">
              Dashboard {currentRoleMeta?.label ?? "SMAN 68 Jakarta"}
            </h1>
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {activePage === "agenda-sekolah" ? (
                activeRole === "admin" ? (
                  <AdminAgendaManager onShowToast={showToast} />
                ) : (
                  <SchoolAgenda />
                )
              ) : activeRole === "student" ? (
                <StudentDashboard
                  userName={userNameState || user.name}
                  studentId={account.studentId ?? undefined}
                  className={account.className ?? undefined}
                  activePage={activePage}
                  onShowToast={showToast}
                  onNavigate={navigateTo}
                />
              ) : activeRole === "teacher" ? (
                <TeacherDashboard
                  userName={userNameState || user.name}
                  className={account.className ?? undefined}
                  activePage={activePage}
                  onShowToast={showToast}
                  onNavigate={navigateTo}
                />
              ) : (
                <AdminDashboard
                  userName={userNameState || user.name}
                  activePage={activePage}
                  onShowToast={showToast}
                  onNavigate={navigateTo}
                />
              )}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Floating Interactive Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-3 px-4 py-3 bg-brand-pine text-white text-xs sm:text-sm font-semibold rounded-xl shadow-card border border-white/20"
          >
            <div className="w-6 h-6 rounded-full bg-brand-leaf text-brand-pine flex items-center justify-center font-bold flex-shrink-0">
              <Check size={14} />
            </div>
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="btn-icon-dark ml-2"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={settingsModalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Pengaturan Dashboard"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 text-ink focus:outline-none"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
                <div className="flex items-center gap-2">
                  <Sliders size={20} className="text-brand-green" />
                  <h3 className="font-display font-bold text-lg text-ink">Pengaturan Dashboard</h3>
                </div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="btn-icon"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Nama Pengguna Tampil
                  </label>
                  <input
                    type="text"
                    value={userNameState}
                    onChange={(e) => setUserNameState(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>

                <div className="pt-2 border-t border-line space-y-3">
                  <div className="text-xs font-bold text-ink uppercase tracking-wider">
                    Preferensi Notifikasi
                  </div>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium text-ink">Email Notifikasi Pengumuman</span>
                    <input
                      type="checkbox"
                      checked={emailNotif}
                      onChange={(e) => setEmailNotif(e.target.checked)}
                      className="rounded text-brand-green focus:ring-brand-green w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium text-ink">Push Notifikasi Browser</span>
                    <input
                      type="checkbox"
                      checked={pushNotif}
                      onChange={(e) => setPushNotif(e.target.checked)}
                      className="rounded text-brand-green focus:ring-brand-green w-4 h-4"
                    />
                  </label>
                </div>

                <div className="pt-2 border-t border-line flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="btn-outline text-xs"
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn-primary text-xs px-5 py-2">
                    Simpan Pengaturan
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
