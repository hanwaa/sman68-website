"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Bell, Check, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionAccount } from "@/lib/auth";
import { useModalA11y } from "@/lib/useModalA11y";
import { PanelSkeleton } from "@/components/dashboard/parts/PanelSkeleton";
import NotificationPopover from "@/components/dashboard/parts/NotificationPopover";
import SettingsModal from "@/components/dashboard/parts/SettingsModal";
import DashboardSidebar from "@/components/dashboard/parts/DashboardSidebar";
import {
  ROLE_LABELS,
  dismissedKeyFor,
  navByRole,
  readKeyFor,
  roles,
  type DashboardNotification,
  type RoleId,
} from "@/components/dashboard/dashboard-nav";

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

            <NotificationPopover
              open={notifOpen}
              notifications={visibleNotifications}
              readIds={readIds}
              unreadCount={unreadCount}
              loaded={notifLoaded}
              onMarkAllRead={markAllNotifsRead}
              onClearAll={clearAllNotifs}
              onMarkRead={markNotifRead}
              onDismiss={dismissNotif}
              onClose={() => setNotifOpen(false)}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex pt-16 flex-1 relative">
        <DashboardSidebar
          open={sidebarOpen}
          isMobile={isMobile}
          navItems={navItems}
          activePage={activePage}
          displayName={userNameState || user.name}
          subtitle={user.subtitle}
          initialsSource={user.name}
          onNavigate={navigateTo}
          onOpenSettings={() => setSettingsOpen(true)}
          onLogout={handleLogout}
          onCloseMobile={() => setSidebarOpen(false)}
        />

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
              aria-label="Tutup notifikasi"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SettingsModal
        open={settingsOpen}
        modalRef={settingsModalRef}
        userName={userNameState}
        emailNotif={emailNotif}
        pushNotif={pushNotif}
        onUserNameChange={setUserNameState}
        onEmailNotifChange={setEmailNotif}
        onPushNotifChange={setPushNotif}
        onSubmit={handleSaveSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
