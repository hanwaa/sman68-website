"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Check, FileText, X } from "lucide-react";
import { useModalA11y } from "@/lib/useModalA11y";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/components/dashboard/parts/admin/helpers";
import type {
  AdminStats,
  AdminUser,
  PendingItem,
} from "@/components/dashboard/parts/admin/types";
import AdminUsersView from "@/components/dashboard/parts/admin/AdminUsersView";
import AdminHomeView from "@/components/dashboard/parts/admin/AdminHomeView";
import AdminNewsModal, {
  type NewsDraft,
} from "@/components/dashboard/parts/admin/AdminNewsModal";
import AdminAnnouncementModal, {
  type MemoDraft,
} from "@/components/dashboard/parts/admin/AdminAnnouncementModal";
import AdminCreateUserModal, {
  type NewUserDraft,
} from "@/components/dashboard/parts/admin/AdminCreateUserModal";
import AdminUserDetailModal from "@/components/dashboard/parts/admin/AdminUserDetailModal";
import AdminEditUserModal, {
  type UserFormState,
} from "@/components/dashboard/parts/admin/AdminEditUserModal";
import AdminLegalisirView from "@/components/dashboard/parts/admin/AdminLegalisirView";

const AdminContentManager = dynamic(() => import("@/components/dashboard/AdminContentManager"), {
  loading: () => <Skeleton className="h-96 w-full" />,
});

interface AdminDashboardProps {
  userName: string;
  activePage?: string;
  onShowToast?: (msg: string) => void;
  onNavigate?: (page: string) => void;
}

const EMPTY_FORM: UserFormState = {
  name: "",
  username: "",
  role: "Siswa",
  detail: "",
  status: "Aktif",
};

export default function AdminDashboard({
  userName,
  activePage = "beranda",
  onShowToast = () => {},
  onNavigate = () => {},
}: AdminDashboardProps) {
  const [pendingList, setPendingList] = useState<PendingItem[]>([]);
  const [moderationLoaded, setModerationLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [userList, setUserList] = useState<AdminUser[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState("Semua");
  const [userStatusFilter, setUserStatusFilter] = useState("Semua");
  const [userPage, setUserPage] = useState(1);
  const [userQuery, setUserQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const userDetailRef = useModalA11y<HTMLDivElement>(!!selectedUser, () => setSelectedUser(null));
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState<UserFormState>(EMPTY_FORM);
  const [userSaving, setUserSaving] = useState(false);
  const editUserRef = useModalA11y<HTMLDivElement>(!!editingUser, () => setEditingUser(null));
  const [modalType, setModalType] = useState<string | null>(null);
  const modalRef = useModalA11y<HTMLDivElement>(!!modalType, () => setModalType(null));

  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [statsUpdatedAt, setStatsUpdatedAt] = useState<Date | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

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
        /* API tidak tersedia, biarkan kosong, tanpa data demo */
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

  // Sinkronkan moderasi & metrik dari database
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin?resource=moderation", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { data?: PendingItem[] } | null) => {
        if (cancelled || !payload?.data) return;
        setPendingList(payload.data);
        setModerationLoaded(true);
      })
      .catch(() => {
        /* API tidak tersedia, biarkan kosong, tanpa data demo */
        if (!cancelled) setModerationLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Metrik realtime: muat saat mount, lalu segarkan tiap 60 detik.
  // Lewati poll saat tab hidden/offline (hemat 27-subselect stats di DB).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (document.hidden || !navigator.onLine) return;
      try {
        const res = await fetch("/api/admin?resource=stats", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const payload = (await res.json()) as { data?: AdminStats };
        if (!cancelled && payload.data) {
          setAdminStats(payload.data);
          setStatsUpdatedAt(new Date());
        }
      } catch (error) {
        console.warn("[admin] gagal memuat stats:", error instanceof Error ? error.message : error);
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
        ? `Prestasi "${title}" disetujui, masuk draft. Lengkapi datanya di Manajemen Data lalu publikasikan.`
        : `Konten "${title}" berhasil disetujui dan dipublikasikan.`
    );
    void fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", id, source }),
    }).catch((error) => {
      console.warn("[admin] approve gagal:", error instanceof Error ? error.message : error);
    });
  };

  const handleReject = (id: string, title: string, source = "queue") => {
    setPendingList((prev) => prev.filter((item) => item.id !== id));
    onShowToast(`Konten "${title}" ditolak.`);
    void fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", id, source }),
    }).catch((error) => {
      console.warn("[admin] reject gagal:", error instanceof Error ? error.message : error);
    });
  };

  const handleCreateUser = async (draft: NewUserDraft) => {
    if (!draft.name.trim() || !draft.username.trim()) return;

    const newUser: AdminUser = {
      id: "u-" + Date.now(),
      name: draft.name.trim(),
      username: draft.username.trim(),
      role: draft.role,
      roleKey: draft.role === "Guru" ? "teacher" : draft.role === "Admin" ? "admin" : "student",
      detail: draft.detail.trim() || "-",
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
          role: draft.role,
          detail: newUser.detail,
        }),
      });
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        data?: { initialPassword?: string };
      } | null;
      if (!res.ok) {
        onShowToast(payload?.error ?? "Akun tersimpan lokal, server menolak.");
        return;
      }
      if (payload?.data?.initialPassword) {
        onShowToast(
          `Akun "${newUser.name}" dibuat. Password awal (sekali tampil): ${payload.data.initialPassword}`
        );
      }
    } catch {
      onShowToast("Akun tersimpan lokal, server tidak terjangkau.");
    }
  };

  const handleCreateNews = async (draft: NewsDraft) => {
    if (!draft.title.trim()) return;
    const slug = draft.title
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
            title: draft.title.trim(),
            category: draft.category,
            excerpt: draft.excerpt,
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
      onShowToast(`Berita "${draft.title}" berhasil diterbitkan!`);
    } catch {
      onShowToast("Server tidak terjangkau.");
    }
  };

  const handleCreateAnnouncement = async (draft: MemoDraft) => {
    if (!draft.title.trim()) return;
    const audience = /guru|staf/i.test(draft.target) ? "teacher" : "student";
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          body: draft.content,
          audience,
          author: userName,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        onShowToast(payload?.error ?? "Gagal menyiarkan pengumuman.");
        return;
      }
      onShowToast(`Pengumuman "${draft.title}" berhasil disiarkan ke ${draft.target}!`);
    } catch {
      onShowToast("Server tidak terjangkau.");
    }
  };

  const filteredUsers = useMemo(() => {
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
  }, [userList, userQuery, userRoleFilter, userStatusFilter]);

  const handleResetPassword = async (user: AdminUser) => {
    const confirmed = window.confirm(
      `Reset password "${user.name}" dengan password acak baru? Password lama langsung tidak berlaku.`
    );
    if (!confirmed) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset-password", id: user.id }),
      });
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
        newPassword?: string;
      } | null;
      if (!res.ok) {
        onShowToast(payload?.error ?? "Gagal mereset password.");
        return;
      }
      onShowToast(
        payload?.newPassword
          ? `Password ${user.name} direset. Password baru (sekali tampil): ${payload.newPassword}`
          : `Password ${user.name} berhasil direset.`
      );
    } catch {
      onShowToast("Gagal mereset password, server tidak terjangkau.");
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
      onShowToast("Gagal memperbarui akun, server tidak terjangkau.");
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
      onShowToast("Gagal menghapus akun, server tidak terjangkau.");
    }
  };

  const handleExportUsers = () => {
    const rows = filteredUsers;
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

  if (activePage === "konten") {
    content = (
      <div>
        <div className="mb-6">
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">
            Manajemen Data
          </h1>
          <p className="text-muted text-sm">
            Kelola semua konten dan data yang tampil di situs, tersimpan langsung ke database.
          </p>
        </div>

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
                      <div className="text-xs text-muted mt-0.5">
                        Oleh: {item.author} · {item.time}
                      </div>
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

        <AdminContentManager onShowToast={onShowToast} />
      </div>
    );
  } else if (activePage === "users") {
    content = (
      <AdminUsersView
        userList={userList}
        loaded={usersLoaded}
        query={userQuery}
        roleFilter={userRoleFilter}
        statusFilter={userStatusFilter}
        page={userPage}
        users={filteredUsers}
        onQueryChange={(value) => {
          setUserQuery(value);
          setUserPage(1);
        }}
        onRoleFilterChange={(value) => {
          setUserRoleFilter(value);
          setUserPage(1);
        }}
        onStatusFilterChange={(value) => {
          setUserStatusFilter(value);
          setUserPage(1);
        }}
        onPageChange={setUserPage}
        onOpenDetail={setSelectedUser}
        onEdit={openEditUser}
        onExport={handleExportUsers}
        onCreate={() => setModalType("user")}
      />
    );
  } else if (activePage === "legalisir") {
    content = <AdminLegalisirView onShowToast={onShowToast} />;
  } else {
    content = (
      <AdminHomeView
        userName={userName}
        stats={adminStats}
        updatedAt={statsUpdatedAt}
        pendingList={pendingList}
        moderationLoaded={moderationLoaded}
        onRefresh={() => setStatsRefreshKey((k) => k + 1)}
        onCreateNews={() => setModalType("berita")}
        onCreateAnnouncement={() => setModalType("pengumuman")}
        onNavigate={onNavigate}
        onAudit={() =>
          onShowToast("Log audit sistem: Status server OPTIMAL (99.98% Uptime).")
        }
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );
  }

  return (
    <div>
      {content}

      <AdminNewsModal
        open={modalType === "berita"}
        modalRef={modalRef}
        onSubmit={handleCreateNews}
        onClose={() => setModalType(null)}
      />

      <AdminAnnouncementModal
        open={modalType === "pengumuman"}
        modalRef={modalRef}
        onSubmit={handleCreateAnnouncement}
        onClose={() => setModalType(null)}
      />

      <AdminCreateUserModal
        open={modalType === "user"}
        modalRef={modalRef}
        classOptions={classOptions}
        onSubmit={handleCreateUser}
        onClose={() => setModalType(null)}
      />

      <AdminUserDetailModal
        user={selectedUser}
        modalRef={userDetailRef}
        onResetPassword={handleResetPassword}
        onEdit={openEditUser}
        onClose={() => setSelectedUser(null)}
      />

      <AdminEditUserModal
        user={editingUser}
        modalRef={editUserRef}
        form={userForm}
        saving={userSaving}
        classOptions={classOptions}
        onFormChange={setUserForm}
        onSubmit={handleUpdateUser}
        onDelete={handleDeleteUser}
        onClose={() => setEditingUser(null)}
      />
    </div>
  );
}
