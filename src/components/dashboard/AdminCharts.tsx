"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface AdminChartsProps {
  weeklyData: { name: string; visitors: number; pageviews: number }[];
  roleChartData: { role: string; count: number; fill: string }[];
}

export default function AdminCharts({ weeklyData, roleChartData }: AdminChartsProps) {
  const hasWeekly = weeklyData.some((item) => item.visitors > 0 || item.pageviews > 0);

  return (
    <div className="grid lg:grid-cols-3 gap-4 mb-6">
      {/* Traffic Area Chart */}
      <div className="card p-5 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-bold text-ink text-base">Pengunjung 7 Hari Terakhir</h2>
            <p className="text-xs text-muted">Pengunjung unik dan halaman dilihat per hari</p>
          </div>
          <span className="badge bg-brand-green/10 text-brand-green text-xs">Data Live</span>
        </div>
        <div className="h-64 w-full">
          {!hasWeekly ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-1 rounded-xl bg-line/30 text-center px-4">
              <span className="text-sm font-semibold text-ink">Belum ada data kunjungan</span>
              <span className="text-xs text-muted">
                Statistik mulai terkumpul setelah pengunjung membuka halaman publik.
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2FA36B" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2FA36B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16794A" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#16794A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E9E4" />
                <XAxis dataKey="name" stroke="#5C6B62" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5C6B62" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B2E20",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  name="Halaman Dilihat"
                  stroke="#2FA36B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPageviews)"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="Pengunjung"
                  stroke="#16794A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* User Breakdown Chart */}
      <div className="card p-5">
        <h2 className="font-display font-bold text-ink text-base mb-1">Distribusi Pengguna</h2>
        <p className="text-xs text-muted mb-4">Total akun terdaftar per peran</p>
        <div className="h-64 w-full">
          {roleChartData.length === 0 ? (
            <div className="h-full w-full animate-pulse rounded-xl bg-line/60" aria-busy="true" aria-live="polite">
              <span className="sr-only">Memuat distribusi pengguna...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E9E4" />
                <XAxis dataKey="role" stroke="#5C6B62" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5C6B62" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B2E20",
                    borderRadius: "12px",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Jumlah Akun" radius={[6, 6, 0, 0]} fill="#16794A" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
