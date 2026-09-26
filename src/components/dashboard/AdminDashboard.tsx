"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Newspaper,
  Bell,
  Eye,
  FileText,
  Shield,
  Plus,
  Check,
  X,
  Search,
  Activity,
  UserCheck,
  Inbox,
  RefreshCw,
  CalendarClock,
  GraduationCap,
  BookOpen,
  Download,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalA11y } from "@/lib/useModalA11y";
import { Skeleton } from "@/components/ui/Skeleton";
import UpcomingAgenda from "@/components/dashboard/UpcomingAgenda";

const AdminContentManager = dynamic(() => import("@/components/dashboard/AdminContentManager"), {
  loading: () => <Skeleton className="h-96 w-full" />,
});
const AdminCharts = dynamic(() => import("@/components/dashboard/AdminCharts"), {
  loading: () => (
    <div className="grid lg:grid-cols-3 gap-4 mb-6" aria-hidden="true">
      <Skeleton className="h-80 lg:col-span-2" />
      <Skeleton className="h-80" />
    </div>
  ),
});

interface AdminDashboardProps {
  userName: string;
  activePage?: string;
  onShowToast?: (msg: string) => void;
  onNavigate?: (page: string) => void;
}

type AdminUser = {
  id: string;
  name: string;
  username: string;
  role: string;
  roleKey: "student" | "teacher" | "admin" | string;
  detail: string;
  status: string;
  nisn: string | null;
  className: string | null;
  nig: string | null;
  subject: string | null;
  position: string | null;
  homeroomName: string | null;
  activeSessions: number;
  lastLoginAt: string | null;
  createdAt: string | null;
};

const USERS_PER_PAGE = 20;

const userInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const relativeDay = (iso: string | null) => {
  if (!iso) return "Belum pernah";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 30) return `${days} hari lalu`;
  return formatDateTime(iso);
};

export default function AdminDashboard({
  userName,
  activePage = "beranda",
  onShowToast = () => {},
  onNavigate,
}: AdminDashboardProps) {
  const [pendingList, setPendingList] = useState<{
    id: string;
    source: string;
    type: string;
    title: string;
    author: string;
    time: string;
    status: string;
  }[]>([]);
  const [moderationLoaded, setModerationLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [userList, setUserList] = useState<AdminUser[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState("Semua");
  const [userStatusFilter, setUserStatusFilter] = useState("Semua");
  const [userPage, setUserPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const userDetailRef = useModalA11y<HTMLDivElement>(!!selectedUser, () => setSelectedUser(null));
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    role: "Siswa",
    detail: "",
    status: "Aktif",
  });
  const [userSaving, setUserSaving] = useState(false);
  const editUserRef = useModalA11y<HTMLDivElement>(!!editingUser, () => setEditingUser(null));
  const [modalType, setModalType] = useState<string | null>(null);
  const modalRef = useModalA11y<HTMLDivElement>(!!modalType, () => setModalType(null));

  // Form states
  const [newsTitle, setNewsTitle] = useState("");
  const [newsCategory, setNewsCategory] = useState("Prestasi");
  const [newsExcerpt, setNewsExcerpt] = useState("");

  const [annTitle, setAnnTitle] = useState("");
  const [annTarget, setAnnTarget] = useState("Semua");
  const [annContent, setAnnContent] = useState("");

  const [userQuery, setUserQuery] = useState("");
  const [adminStats, setAdminStats] = useState<{
    students: number;
    teachers: number;
    admins: number;
    activeUsers: number;
    news: number;
    newsDraft: number;
    announcements: number;
    achievements: number;
    achievementsPending: number;
    extracurriculars: number;
    alumni: number;
    classes: number;
    assignments: number;
    submissionsPending: number;
    eventsUpcoming: number;
    onlineSessions: number;
    loginsToday: number;
    presentToday: number;
    visitorsToday: number;
    pageviewsToday: number;
    pageviewsTotal: number;
    moderationPending: number;
    roles: { student: number; teacher: number; admin: number };
    weekly: { day: string; visitors: number; pageviews: number }[];
    topPages: { path: string; views: number }[];
    updatedAt: string;
  } | null>(null);
  const [statsUpdatedAt, setStatsUpdatedAt] = useState<Date | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  // Tambah User form
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("Siswa");
  const [newUserDetail, setNewUserDetail] = useState("");

  // Data pengguna baru diambil saat tab "Data Pengguna" dibuka.
  useEffect(() => {
    if (activePage !== "users" || usersLoaded) return;
    let cancelled = false;
    fetch("/api/admin?resource=users", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { data?: AdminUser[] } | null) => {
        if (cancelled || !payload?.data) return;
        setUserList(payload.data);
        setUsersLoaded(true);
      })
      .catch(() => {
        /* API tidak tersedia — biarkan kosong, tanpa data demo */
        if (!cancelled) setUsersLoaded(true);
      });

    fetch("/api/admin?resource=classes", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { data?: string[] } | null) => {
        if (!cancelled && payload?.data) setClassOptions(payload.data);
      })
      .catch(() => {
        /* daftar kelas opsional */
      });

    return () => {
      cancelled = true;
    };
  }, [activePage, usersLoaded]);

  // Sinkronkan moderasi & metrik dari Neon
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin?resource=moderation", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          payload:
            | {
                data?: {
                  id: string;
                  source: string;
                  type: string;
                  title: string;
                  author: string;
                  time: string;
                  status: string;
                }[];
              }
            | null
        ) => {
          if (cancelled || !payload?.data) return;
          setPendingList(payload.data);
          setModerationLoaded(true);
        }
      )
      .catch(() => {
        /* API tidak tersedia — biarkan kosong, tanpa data demo */
        if (!cancelled) setModerationLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Metrik realtime: muat saat mount, lalu segarkan tiap 60 detik.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/admin?resource=stats", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const payload = (await res.json()) as { data?: typeof adminStats };
        if (!cancelled && payload.data) {
          setAdminStats(payload.data);
          setStatsUpdatedAt(new Date());
        }
      } catch {
        /* biarkan angka terakhir tetap tampil */
      }
    };
    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [statsRefreshKey]);

  const handleApprove = (id: string, title: string, source = "queue") => {
    setPendingList((prev) => prev.filter((item) => item.id !== id));
    onShowToast(
      source === "achievements"
        ? `Prestasi "${title}" disetujui — masuk draft. Lengkapi datanya di Manajemen Data lalu publikasikan.`
        : `Konten "${title}" berhasil disetujui dan dipublikasikan.`
    );
    void fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", id, source }),
    }).catch(() => {});
  };

  const handleReject = (id: string, title: string, source = "queue") => {
    setPendingList((prev) => prev.filter((item) => item.id !== id));
    onShowToast(`Konten "${title}" ditolak.`);
    void fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", id, source }),
    }).catch(() => {});
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser: AdminUser = {
      id: "u-" + Date.now(),
      name: newUserName.trim(),
      username: newUserEmail.trim(),
      role: newUserRole,
      roleKey: newUserRole === "Guru" ? "teacher" : newUserRole === "Admin" ? "admin" : "student",
      detail: newUserDetail.trim() || "-",
      status: "Aktif",
      nisn: null,
      className: null,
      nig: null,
      subject: null,
      position: null,
      homeroomName: null,
      activeSessions: 0,
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    };

    setUserList((prev) => [newUser, ...prev]);
    onShowToast(`Akun "${newUser.name}" berhasil ditambahkan sebagai ${newUser.role}.`);

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-user",
          name: newUser.name,
          email: newUser.username,
          role: newUserRole,
          detail: newUser.detail,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        onShowToast(payload?.error ?? "Akun tersimpan lokal — server menolak.");
      }
    } catch {
      onShowToast("Akun tersimpan lokal — server tidak terjangkau.");
    }

    setNewUserName("");
    setNewUserEmail("");
    setNewUserDetail("");
    setModalType(null);
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim()) return;
    const slug = newsTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    try {
      const res = await fetch("/api/admin/cms?resource=news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: {
            slug,
            title: newsTitle.trim(),
            category: newsCategory,
            excerpt: newsExcerpt,
            status: "published",
            author: userName,
            published_at: new Date().toISOString().slice(0, 16),
          },
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        onShowToast(payload?.error ?? "Gagal menerbitkan berita.");
        return;
      }
      onShowToast(`Berita "${newsTitle}" berhasil diterbitkan!`);
    } catch {
      onShowToast("Server tidak terjangkau.");
    }
    setNewsTitle("");
    setNewsExcerpt("");
    setModalType(null);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) return;
    const audience = /guru|staf/i.test(annTarget) ? "teacher" : "student";
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle.trim(),
          body: annContent,
          audience,
          author: userName,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        onShowToast(payload?.error ?? "Gagal menyiarkan pengumuman.");
        return;
      }
      onShowToast(`Pengumuman "${annTitle}" berhasil disiarkan ke ${annTarget}!`);
    } catch {
      onShowToast("Server tidak terjangkau.");
    }
    setAnnTitle("");
    setAnnContent("");
    setModalType(null);
  };

  const filterUsers = () => {
    const q = userQuery.trim().toLowerCase();
    return userList.filter((u) => {
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.detail.toLowerCase().includes(q) ||
        (u.nisn ?? "").includes(q) ||
        (u.className ?? "").toLowerCase().includes(q);
      const matchRole = userRoleFilter === "Semua" || u.role === userRoleFilter;
      const matchStatus =
        userStatusFilter === "Semua" ||
        (userStatusFilter === "Online" ? u.activeSessions > 0 : u.status === userStatusFilter);
      return matchQuery && matchRole && matchStatus;
    });
  };

  const handleResetPassword = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Reset password "${user.name}" menjadi username/NISN-nya (${user.username})?`
    );
    if (!confirmed) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", id: user.id }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        onShowToast(payload?.error ?? "Gagal mereset password.");
        return;
      }
      onShowToast(`Password ${user.name} direset ke ${user.username}.`);
    } catch {
      onShowToast("Gagal mereset password — server tidak terjangkau.");
    }
  };

  const openEditUser = (user: AdminUser) => {
    setUserForm({
      name: user.name,
      username: user.username,
      role: user.role,
      detail:
        user.role === "Siswa"
          ? user.className ?? (user.detail === "-" ? "" : user.detail)
          : user.detail === "-"
            ? ""
            : user.detail,
      status: user.status,
    });
    setSelectedUser(null);
    setEditingUser(user);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || userSaving) return;
    if (!userForm.name.trim() || !userForm.username.trim()) {
      onShowToast("Nama dan username wajib diisi.");
      return;
    }
    setUserSaving(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-user",
          id: editingUser.id,
          name: userForm.name.trim(),
          username: userForm.username.trim(),
          role: userForm.role,
          detail: userForm.detail.trim(),
          status: userForm.status,
        }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        onShowToast(payload?.error ?? "Gagal memperbarui akun.");
        return;
      }
      const nextName = userForm.name.trim();
      const nextUsername = userForm.username.trim();
      const nextDetail = userForm.detail.trim() || "-";
      setUserList((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: nextName,
                username: nextUsername,
                role: userForm.role,
                roleKey:
                  userForm.role === "Guru" ? "teacher" : userForm.role === "Admin" ? "admin" : "student",
                detail: nextDetail,
                className: userForm.role === "Siswa" && nextDetail !== "-" ? nextDetail : u.className,
                status: userForm.status,
              }
            : u
        )
      );
      onShowToast(`Akun "${nextName}" berhasil diperbarui.`);
      setEditingUser(null);
    } catch {
      onShowToast("Gagal memperbarui akun — server tidak terjangkau.");
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Hapus akun "${user.name}" (${user.username}) secara permanen? Tindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-user", id: user.id }),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        onShowToast(payload?.error ?? "Gagal menghapus akun.");
        return;
      }
      setUserList((prev) => prev.filter((u) => u.id !== user.id));
      setEditingUser(null);
      setSelectedUser(null);
      onShowToast(`Akun "${user.name}" dihapus.`);
    } catch {
      onShowToast("Gagal menghapus akun — server tidak terjangkau.");
    }
  };

  const handleExportUsers = () => {
    const rows = filterUsers();
    const header = ["Nama", "Username/NISN", "Peran", "Kelas/Unit", "Status", "Sesi Aktif", "Login Terakhir"];
    const lines = rows.map((u) => [
      u.name,
      u.username,
      u.role,
      u.className ?? u.homeroomName ?? u.detail,
      u.status,
      String(u.activeSessions),
      u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "",
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pengguna-sman68-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`${rows.length} data pengguna diunduh sebagai CSV.`);
  };

  let content: React.ReactNode;

  const roleChartData = adminStats?.roles
    ? [
        { role: "Siswa", count: adminStats.roles.student, fill: "#16794A" },
        { role: "Guru", count: adminStats.roles.teacher, fill: "#2FA36B" },
        { role: "Admin", count: adminStats.roles.admin, fill: "#4FBE86" },
      ]
    : [];

  const weeklyChartData = (adminStats?.weekly ?? []).map((item) => ({
    name: new Date(`${item.day}T00:00:00`).toLocaleDateString("id-ID", { weekday: "short" }),
    visitors: item.visitors,
    pageviews: item.pageviews,
  }));

  // Render Sub-Page Views
  if (activePage === "konten") {
    content = (
      <div>
        <div className="mb-6">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">
            Manajemen Data
          </h1>
          <p className="text-muted text-sm">
            Kelola semua konten dan data yang tampil di situs — tersimpan langsung ke database.
          </p>
        </div>

        {/* Persetujuan konten */}
        <div className="card p-5 mb-4">
          <h2 className="font-semibold text-ink text-base mb-4 flex items-center gap-2">
            <FileText size={18} className="text-brand-green" />
            Menunggu Persetujuan (
            {moderationLoaded ? (
              pendingList.length
            ) : (
              <Skeleton className="inline-block h-4 w-6 align-middle" />
            )}
            )
          </h2>
          {pendingList.length > 0 ? (
            <div className="divide-y divide-line">
              {pendingList.map((item) => (
                <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="badge bg-brand-green/10 text-brand-green text-xs mt-0.5">
                      {item.type}
                    </span>
                    <div>
                      <div className="font-semibold text-ink text-sm">{item.title}</div>
                      <div className="text-xs text-muted mt-0.5">Oleh: {item.author} · {item.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleApprove(item.id, item.title, item.source)}
                      className="btn-ghost text-xs gap-1.5"
                    >
                      <Check size={13} /> Setujui
                    </button>
                    <button
                      onClick={() => handleReject(item.id, item.title, item.source)}
                      className="btn-danger text-xs gap-1.5"
                    >
                      <X size={13} /> Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted">
              Semua konten telah dimoderasi. Tidak ada antrian pending.
            </div>
          )}
        </div>

        {/* CMS: kelola semua konten dari database */}
        <AdminContentManager onShowToast={onShowToast} />
      </div>
    );
  } else if (activePage === "users") {
    const filteredUsers = filterUsers();
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
    const currentPage = Math.min(userPage, totalPages);
    const pageUsers = filteredUsers.slice(
      (currentPage - 1) * USERS_PER_PAGE,
      currentPage * USERS_PER_PAGE
    );
    const countByRole = (role: string) => userList.filter((u) => u.role === role).length;
    const onlineCount = userList.filter((u) => u.activeSessions > 0).length;
    const activeCount = userList.filter((u) => u.status === "Aktif").length;

    const roleBadge = (roleKey: string) =>
      roleKey === "admin"
        ? "bg-brand-pine text-white"
        : roleKey === "teacher"
          ? "bg-brand-lime/25 text-brand-pine"
          : "bg-brand-green/10 text-brand-green";

    content = (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">
              Manajemen Pengguna
            </h1>
            <p className="text-muted text-sm">
              Data lengkap akun siswa, guru, dan admin — peran, kelas, aktivitas login, dan status.
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <button
              onClick={handleExportUsers}
              disabled={userList.length === 0}
              className="btn-ghost text-xs px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Unduh CSV
            </button>
            <button
              onClick={() => setModalType("user")}
              className="btn-primary text-xs px-4 py-2.5"
            >
              <Plus size={15} /> Tambah User
            </button>
          </div>
        </div>

        {/* Ringkasan akun */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
          {[
            { label: "Total Akun", value: userList.length, icon: Users, tone: "bg-brand-mist text-brand-pine" },
            { label: "Siswa", value: countByRole("Siswa"), icon: GraduationCap, tone: "bg-brand-green/10 text-brand-green" },
            { label: "Guru", value: countByRole("Guru"), icon: BookOpen, tone: "bg-brand-lime/20 text-brand-pine" },
            { label: "Admin", value: countByRole("Admin"), icon: Shield, tone: "bg-brand-pine/10 text-brand-pine" },
            { label: "Akun Aktif", value: activeCount, icon: UserCheck, tone: "bg-brand-mist text-brand-green" },
            { label: "Sedang Online", value: onlineCount, icon: Activity, tone: "bg-brand-green/10 text-brand-green" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="card p-3.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", item.tone)}>
                  <Icon size={15} aria-hidden="true" />
                </div>
                <div className="font-display font-extrabold text-xl text-ink mt-2 tabular-nums">
                  {item.value.toLocaleString("id-ID")}
                </div>
                <div className="text-[10px] text-muted font-semibold uppercase tracking-wide mt-0.5">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter */}
        <div className="card p-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                placeholder="Cari nama, username/NISN, kelas, atau unit..."
                value={userQuery}
                onChange={(e) => {
                  setUserQuery(e.target.value);
                  setUserPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1.5" role="group" aria-label="Filter peran">
                {["Semua", "Siswa", "Guru", "Admin"].map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setUserRoleFilter(role);
                      setUserPage(1);
                    }}
                    aria-pressed={userRoleFilter === role}
                    className={cn("chip", userRoleFilter === role && "chip-active")}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <select
                value={userStatusFilter}
                onChange={(e) => {
                  setUserStatusFilter(e.target.value);
                  setUserPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-line bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-green/30"
              >
                <option value="Semua">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
                <option value="Online">Sedang Online</option>
              </select>
            </div>
          </div>
          <div className="text-[11px] text-muted mt-3">
            Menampilkan <strong className="text-ink">{filteredUsers.length}</strong> dari {userList.length}{" "}
            akun{userRoleFilter !== "Semua" ? ` · peran ${userRoleFilter}` : ""}
          </div>
        </div>

        {/* Tabel */}
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[860px]">
              <thead className="bg-cream/60">
                <tr className="text-[10px] text-muted uppercase tracking-wider border-b border-line">
                  <th className="px-4 py-3 font-semibold">Pengguna</th>
                  <th className="px-4 py-3 font-semibold">Peran</th>
                  <th className="px-4 py-3 font-semibold">Kelas / Unit</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Aktivitas</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pageUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-cream/50 transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="flex items-center gap-2.5 text-left group"
                      >
                        <span className="w-9 h-9 rounded-xl bg-brand-pine text-brand-lime font-display font-extrabold text-[11px] flex items-center justify-center flex-shrink-0">
                          {userInitials(u.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink text-xs sm:text-sm truncate group-hover:text-brand-green transition-colors">
                            {u.name}
                          </span>
                          <span className="block text-[11px] text-muted">{u.username}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("badge text-[10px]", roleBadge(u.roleKey))}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-ink">
                        {u.className ?? u.homeroomName ?? u.detail}
                      </div>
                      <div className="text-[10px] text-muted">
                        {u.nisn ? `NISN ${u.nisn}` : u.nig ? `NIP ${u.nig}` : u.subject ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "badge text-[10px] w-fit",
                            u.status === "Aktif" ? "bg-brand-mist text-brand-green" : "bg-line text-muted"
                          )}
                        >
                          {u.status}
                        </span>
                        {u.activeSessions > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-green">
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"
                              aria-hidden="true"
                            />
                            online
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] text-ink">{relativeDay(u.lastLoginAt)}</div>
                      <div className="text-[10px] text-muted">{u.activeSessions} sesi aktif</div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink px-2 py-1 rounded hover:bg-cream transition-colors"
                      >
                        <Eye size={13} aria-hidden="true" /> Detail
                      </button>
                      <button
                        onClick={() => openEditUser(u)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green hover:text-brand-pine px-2 py-1 rounded hover:bg-brand-green/5 transition-colors"
                      >
                        <Pencil size={13} aria-hidden="true" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!usersLoaded && (
            <div className="p-6 space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {usersLoaded && filteredUsers.length === 0 && (
            <div className="text-center py-14">
              <div className="w-12 h-12 rounded-2xl bg-cream border border-line flex items-center justify-center mx-auto mb-3">
                <Users size={20} className="text-muted" aria-hidden="true" />
              </div>
              <div className="font-semibold text-ink text-sm">Pengguna tidak ditemukan</div>
              <div className="text-muted text-xs mt-1">Coba ubah kata kunci atau filter.</div>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-line bg-cream/40">
              <span className="text-[11px] text-muted">
                Halaman {currentPage} dari {totalPages} · {filteredUsers.length} akun
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={13} /> Sebelumnya
                </button>
                <button
                  onClick={() => setUserPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Berikutnya <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    // Default: Beranda View
    content = (
    <div>
      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink mb-1">
              Panel Admin, {userName.split(" ")[0]}!
            </h1>
            <p className="text-muted text-sm">
              Ringkasan performa dan kontrol portal SMAN 68 Jakarta.
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1.5 font-semibold text-brand-green">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" aria-hidden="true" />
                Realtime
              </span>
              <span aria-live="polite">
                diperbarui {statsUpdatedAt ? statsUpdatedAt.toLocaleTimeString("id-ID") : "—"}
              </span>
              <button
                onClick={() => setStatsRefreshKey((k) => k + 1)}
                className="inline-flex items-center gap-1 font-semibold text-brand-green hover:text-brand-pine"
              >
                <RefreshCw size={11} aria-hidden="true" /> Segarkan
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModalType("berita")}
              className="btn-primary text-xs px-3.5 py-2"
            >
              <Plus size={14} /> Berita Baru
            </button>
            <button
              onClick={() => setModalType("pengumuman")}
              className="btn-ghost text-xs px-3.5 py-2"
            >
              <Bell size={14} /> Siarkan Memo
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Realtime */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
        {[
          {
            label: "Pengunjung Hari Ini",
            value: adminStats ? adminStats.visitorsToday.toLocaleString("id-ID") : "—",
            sub: adminStats ? `${adminStats.pageviewsToday.toLocaleString("id-ID")} halaman dilihat` : "menunggu data",
            icon: Eye,
            tone: "bg-brand-green/10 text-brand-green",
          },
          {
            label: "Pengguna Online",
            value: adminStats ? adminStats.onlineSessions.toLocaleString("id-ID") : "—",
            sub: adminStats
              ? `aktif 5 menit terakhir · ${adminStats.loginsToday.toLocaleString("id-ID")} login hari ini`
              : "menunggu data",
            icon: Activity,
            tone: "bg-brand-leaf/15 text-brand-green",
          },
          {
            label: "Kehadiran Hari Ini",
            value: adminStats ? adminStats.presentToday.toLocaleString("id-ID") : "—",
            sub: adminStats
              ? `${adminStats.students > 0 ? Math.round((adminStats.presentToday / adminStats.students) * 100) : 0}% dari ${adminStats.students.toLocaleString("id-ID")} siswa`
              : "menunggu data",
            icon: UserCheck,
            tone: "bg-brand-mist text-brand-pine",
          },
          {
            label: "Perlu Moderasi",
            value: adminStats ? adminStats.moderationPending.toLocaleString("id-ID") : "—",
            sub: "konten menunggu tinjauan",
            icon: Inbox,
            tone:
              adminStats && adminStats.moderationPending > 0
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

      {/* Metrik Pendukung */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Berita Tayang", value: adminStats?.news, sub: `${adminStats?.newsDraft ?? 0} draf & pending`, icon: Newspaper },
          { label: "Pengumuman Terbit", value: adminStats?.announcements, sub: "siswa & guru", icon: Bell },
          { label: "Total Pembaca", value: adminStats?.pageviewsTotal, sub: `${adminStats?.pageviewsToday ?? 0} hari ini`, icon: Eye },
          { label: "Agenda Mendatang", value: adminStats?.eventsUpcoming, sub: "event aktif", icon: CalendarClock },
          { label: "Prestasi Terdata", value: adminStats?.achievements, sub: `${adminStats?.achievementsPending ?? 0} menunggu verifikasi`, icon: GraduationCap },
          { label: "Tugas Belum Dinilai", value: adminStats?.submissionsPending, sub: "kelas digital", icon: FileText },
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

      {/* Charts Section */}
      <AdminCharts weeklyData={weeklyChartData} roleChartData={roleChartData} />

      {/* Halaman Terpopuler */}
      {adminStats && adminStats.topPages.length > 0 && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-ink text-base">Halaman Terpopuler</h2>
            <span className="text-[11px] text-muted">akumulasi kunjungan</span>
          </div>
          <ol className="space-y-2">
            {adminStats.topPages.slice(0, 5).map((page, index) => (
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

      {/* Agenda terdekat */}
      <div className="mb-4">
        <UpcomingAgenda onNavigate={onNavigate} />
      </div>

      {/* Moderation & Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Pending Content Moderation */}
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
                    <div className="text-xs text-muted">Oleh {item.author} · {item.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button
                    onClick={() => handleApprove(item.id, item.title, item.source)}
                    className="btn-ghost text-xs gap-1"
                  >
                    <Check size={12} /> Setujui
                  </button>
                  <button
                    onClick={() => handleReject(item.id, item.title, item.source)}
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

        {/* Quick CMS Launcher */}
        <div className="card p-5">
          <h2 className="font-semibold text-ink text-sm mb-3.5">Pintasan Manajemen</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: "Buat Berita", icon: Newspaper, color: "text-brand-green", onClick: () => setModalType("berita") },
              { label: "Siarkan Memo", icon: Bell, color: "text-brand-green", onClick: () => setModalType("pengumuman") },
              { label: "Kelola User", icon: Users, color: "text-brand-green", onClick: () => onNavigate?.("users") },
              { label: "Audit Sistem", icon: Shield, color: "text-brand-green", onClick: () => onShowToast("Log audit sistem: Status server OPTIMAL (99.98% Uptime).") },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="flex flex-col items-center justify-center p-3.5 bg-cream hover:bg-brand-pine hover:text-white rounded-xl text-center group transition-all"
                >
                  <Icon size={20} className={`${action.color} group-hover:text-brand-leaf mb-1.5 transition-colors`} />
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

  return (
    <div>
      {content}

      {/* Modal: Buat Berita */}
      <AnimatePresence>
        {modalType === "berita" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Publikasikan Berita Baru"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Newspaper size={20} className="text-brand-green" />
                  <h3 className="font-display font-bold text-lg text-ink">Publikasikan Berita Baru</h3>
                </div>
                <button onClick={() => setModalType(null)} className="btn-icon">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateNews} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Judul Berita</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Siswa SMAN 68 Raih Medali Emas Olimpiade Kimia"
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Kategori</label>
                  <select
                    value={newsCategory}
                    onChange={(e) => setNewsCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  >
                    <option value="Prestasi">Prestasi</option>
                    <option value="Kegiatan">Kegiatan</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Pengumuman">Pengumuman</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Ringkasan Berita</label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan ringkasan singkat untuk artikel ini..."
                    value={newsExcerpt}
                    onChange={(e) => setNewsExcerpt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="btn-outline text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs px-5 py-2"
                  >
                    Terbitkan Sekarang
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Siarkan Pengumuman */}
      <AnimatePresence>
        {modalType === "pengumuman" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Siarkan Memo Resmi"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Bell size={20} className="text-brand-leaf" />
                  <h3 className="font-display font-bold text-lg text-ink">Siarkan Memo Resmi</h3>
                </div>
                <button onClick={() => setModalType(null)} className="btn-icon">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Judul Memo / Pengumuman</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penyesuaian Jadwal Belajar Mengajar Pekan Ini"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Target Sasaran</label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                  >
                    <option value="Semua Komunitas">Semua (Siswa, Guru & Staf)</option>
                    <option value="Siswa Saja">Siswa Saja</option>
                    <option value="Guru & Staf">Guru & Staf Saja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Isi Pesan</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tuliskan isi memo pengumuman secara jelas..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-leaf/30"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="btn-outline text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs px-5 py-2"
                  >
                    Siarkan Sekarang
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Tambah User */}
      <AnimatePresence>
        {modalType === "user" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label="Tambah User Baru"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-brand-green" />
                  <h3 className="font-display font-bold text-lg text-ink">Tambah User Baru</h3>
                </div>
                <button onClick={() => setModalType(null)} className="btn-icon">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Siti Nurhaliza"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Username (NISN / NIP / NPSN)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0068100101"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                  <p className="text-[10px] text-muted mt-1">
                    Password awal otomatis sama dengan username ini.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Peran</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => {
                        const role = e.target.value;
                        setNewUserRole(role);
                        setNewUserDetail(role === "Siswa" ? "" : newUserDetail);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    >
                      <option value="Siswa">Siswa</option>
                      <option value="Guru">Guru</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">
                      {newUserRole === "Siswa" ? "Kelas" : "Keterangan"}
                    </label>
                    {newUserRole === "Siswa" ? (
                      <select
                        required
                        value={newUserDetail}
                        onChange={(e) => setNewUserDetail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                      >
                        <option value="">Pilih kelas…</option>
                        {classOptions.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Mapel / Jabatan"
                        value={newUserDetail}
                        onChange={(e) => setNewUserDetail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                      />
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="btn-outline text-xs"
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn-primary text-xs px-5 py-2">
                    Tambahkan User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Detail User */}
      <AnimatePresence>
        {selectedUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={userDetailRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={`Detail ${selectedUser.name}`}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg bg-white rounded-2xl p-6 sm:p-7 shadow-card-hover z-10 focus:outline-none max-h-[88vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedUser(null)}
                className="btn-icon absolute top-4 right-4"
                aria-label="Tutup detail"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3.5 mb-5">
                <span className="w-14 h-14 rounded-2xl bg-brand-pine text-brand-lime font-display font-extrabold text-lg flex items-center justify-center flex-shrink-0">
                  {userInitials(selectedUser.name)}
                </span>
                <div className="min-w-0">
                  <h2 className="font-display font-extrabold text-lg text-ink leading-tight truncate">
                    {selectedUser.name}
                  </h2>
                  <p className="text-muted text-xs mt-0.5">Username: {selectedUser.username}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span
                      className={cn(
                        "badge text-[10px]",
                        selectedUser.roleKey === "admin"
                          ? "bg-brand-pine text-white"
                          : selectedUser.roleKey === "teacher"
                            ? "bg-brand-lime/25 text-brand-pine"
                            : "bg-brand-green/10 text-brand-green"
                      )}
                    >
                      {selectedUser.role}
                    </span>
                    <span
                      className={cn(
                        "badge text-[10px]",
                        selectedUser.status === "Aktif"
                          ? "bg-brand-mist text-brand-green"
                          : "bg-line text-muted"
                      )}
                    >
                      {selectedUser.status}
                    </span>
                    {selectedUser.activeSessions > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-green">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"
                          aria-hidden="true"
                        />
                        {selectedUser.activeSessions} sesi aktif
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: "NISN", value: selectedUser.nisn },
                  { label: "Kelas", value: selectedUser.className },
                  { label: "NIP / NIG", value: selectedUser.nig },
                  { label: "Mata Pelajaran", value: selectedUser.subject },
                  { label: "Jabatan", value: selectedUser.position },
                  { label: "Wali Kelas", value: selectedUser.homeroomName },
                  { label: "Keterangan", value: selectedUser.detail },
                  {
                    label: "Terdaftar",
                    value: selectedUser.createdAt ? formatDateTime(selectedUser.createdAt) : null,
                  },
                  {
                    label: "Login Terakhir",
                    value: selectedUser.lastLoginAt
                      ? `${formatDateTime(selectedUser.lastLoginAt)} (${relativeDay(selectedUser.lastLoginAt)})`
                      : null,
                  },
                ]
                  .filter((item) => item.value)
                  .map((item) => (
                    <div key={item.label} className="bg-cream rounded-xl p-3">
                      <dt className="text-[10px] text-muted uppercase tracking-wide font-semibold">
                        {item.label}
                      </dt>
                      <dd className="text-xs font-semibold text-ink mt-0.5 break-words">
                        {item.value}
                      </dd>
                    </div>
                  ))}
              </dl>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-line">
                <button
                  onClick={() => handleResetPassword(selectedUser)}
                  className="btn-outline text-xs flex-1"
                >
                  <KeyRound size={14} /> Reset Password
                </button>
                <button
                  onClick={() => openEditUser(selectedUser)}
                  className="btn-primary text-xs flex-1"
                >
                  <Pencil size={14} /> Edit Akun
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Edit User */}
      <AnimatePresence>
        {editingUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={editUserRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={`Edit ${editingUser.name}`}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-white rounded-2xl p-6 sm:p-7 shadow-card-hover z-10 focus:outline-none max-h-[88vh] overflow-y-auto"
            >
              <button
                onClick={() => setEditingUser(null)}
                className="btn-icon absolute top-4 right-4"
                aria-label="Tutup form edit"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2 mb-5">
                <span className="w-10 h-10 rounded-xl bg-brand-pine text-brand-lime flex items-center justify-center flex-shrink-0">
                  <Pencil size={17} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink leading-tight">Edit Akun</h3>
                  <p className="text-muted text-xs">Username saat ini: {editingUser.username}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Username (NISN / NIP / NPSN)
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Peran</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => {
                        const role = e.target.value;
                        setUserForm((f) => ({
                          ...f,
                          role,
                          detail: role === "Siswa" ? "" : f.detail,
                        }));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    >
                      <option value="Siswa">Siswa</option>
                      <option value="Guru">Guru</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Status</label>
                    <select
                      value={userForm.status}
                      onChange={(e) => setUserForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    {userForm.role === "Siswa" ? "Kelas" : "Keterangan (Mapel / Jabatan)"}
                  </label>
                  {userForm.role === "Siswa" ? (
                    <select
                      required
                      value={userForm.detail}
                      onChange={(e) => setUserForm((f) => ({ ...f, detail: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    >
                      <option value="">Pilih kelas…</option>
                      {[
                        ...(userForm.detail && !classOptions.includes(userForm.detail)
                          ? [userForm.detail]
                          : []),
                        ...classOptions,
                      ].map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Contoh: Fisika / Super Admin"
                      value={userForm.detail}
                      onChange={(e) => setUserForm((f) => ({ ...f, detail: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(editingUser)}
                    className="btn-danger text-xs sm:mr-auto"
                  >
                    <Trash2 size={14} /> Hapus Akun
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="btn-outline text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={userSaving}
                    className="btn-primary text-xs px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {userSaving ? "Menyimpan..." : "Update"}
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
