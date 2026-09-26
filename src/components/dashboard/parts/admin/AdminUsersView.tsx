"use client";

import {
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { relativeDay, roleBadge, userInitials } from "@/components/dashboard/parts/admin/helpers";
import { USERS_PER_PAGE, type AdminUser } from "@/components/dashboard/parts/admin/types";

type Props = {
  userList: AdminUser[];
  loaded: boolean;
  query: string;
  roleFilter: string;
  statusFilter: string;
  page: number;
  filteredCount: number;
  onQueryChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onOpenDetail: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onExport: () => void;
  onCreate: () => void;
};

export default function AdminUsersView({
  userList,
  loaded,
  query,
  roleFilter,
  statusFilter,
  page,
  filteredCount,
  onQueryChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onPageChange,
  onOpenDetail,
  onEdit,
  onExport,
  onCreate,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(filteredCount / USERS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = userList.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );
  const countByRole = (role: string) => userList.filter((u) => u.role === role).length;
  const onlineCount = userList.filter((u) => u.activeSessions > 0).length;
  const activeCount = userList.filter((u) => u.status === "Aktif").length;

  return (
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
            onClick={onExport}
            disabled={userList.length === 0}
            className="btn-ghost text-xs px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={14} /> Unduh CSV
          </button>
          <button onClick={onCreate} className="btn-primary text-xs px-4 py-2.5">
            <Plus size={15} /> Tambah User
          </button>
        </div>
      </div>

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

      <div className="card p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Cari nama, username/NISN, kelas, atau unit..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1.5" role="group" aria-label="Filter peran">
              {["Semua", "Siswa", "Guru", "Admin"].map((role) => (
                <button
                  key={role}
                  onClick={() => onRoleFilterChange(role)}
                  aria-pressed={roleFilter === role}
                  className={cn("chip", roleFilter === role && "chip-active")}
                >
                  {role}
                </button>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
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
          Menampilkan <strong className="text-ink">{filteredCount}</strong> dari {userList.length} akun
          {roleFilter !== "Semua" ? ` · peran ${roleFilter}` : ""}
        </div>
      </div>

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
                      onClick={() => onOpenDetail(u)}
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
                      onClick={() => onOpenDetail(u)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink px-2 py-1 rounded hover:bg-cream transition-colors"
                    >
                      <Eye size={13} aria-hidden="true" /> Detail
                    </button>
                    <button
                      onClick={() => onEdit(u)}
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

        {!loaded && (
          <div className="p-6 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {loaded && filteredCount === 0 && (
          <div className="text-center py-14">
            <div className="w-12 h-12 rounded-2xl bg-cream border border-line flex items-center justify-center mx-auto mb-3">
              <Users size={20} className="text-muted" aria-hidden="true" />
            </div>
            <div className="font-semibold text-ink text-sm">Pengguna tidak ditemukan</div>
            <div className="text-muted text-xs mt-1">Coba ubah kata kunci atau filter.</div>
          </div>
        )}

        {filteredCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-line bg-cream/40">
            <span className="text-[11px] text-muted">
              Halaman {currentPage} dari {totalPages} · {filteredCount} akun
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={13} /> Sebelumnya
              </button>
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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
}
