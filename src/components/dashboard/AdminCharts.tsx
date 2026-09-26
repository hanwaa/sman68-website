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

type TooltipEntry = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
};

const formatValue = (value: number | string | undefined) =>
  typeof value === "number" ? value.toLocaleString("id-ID") : (value ?? "—");

/**
 * Tooltip kustom: Recharts memberi warna teks According to series memakai warna
 * series (hijau tua di atas hijau tua) sehingga nilanya nyaris tak terbaca.
 * Di sini teks selalu putih, warna series hanya dipakai sebagai titik penanda.
 */
function ChartTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[9rem] rounded-xl bg-[#062A31] px-3.5 py-2.5 text-xs shadow-lg ring-1 ring-white/15">
      {label !== undefined && label !== "" ? (
        <p className="mb-2 font-semibold text-white">{label}</p>
      ) : null}
      <ul className="space-y-1.5">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/40"
              style={{ backgroundColor: entry.color ?? "#FFFF00" }}
            />
            <span className="text-white/80">{entry.name}</span>
            <span className="ml-auto pl-3 text-sm font-bold tabular-nums text-white">
              {formatValue(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const HOVER_CURSOR = { stroke: "#7C8C82", strokeWidth: 1, strokeDasharray: "4 4" };

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
                    <stop offset="5%" stopColor="#0B7688" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0B7688" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A5A66" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#0A5A66" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CFE7EC" />
                <XAxis dataKey="name" stroke="#4C6B75" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4C6B75" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={HOVER_CURSOR} />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  name="Halaman Dilihat"
                  stroke="#0B7688"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPageviews)"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name="Pengunjung"
                  stroke="#0A5A66"
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CFE7EC" />
                <XAxis dataKey="role" stroke="#4C6B75" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#4C6B75" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={HOVER_CURSOR} />
                <Bar dataKey="count" name="Jumlah Akun" radius={[6, 6, 0, 0]} fill="#0A5A66" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
