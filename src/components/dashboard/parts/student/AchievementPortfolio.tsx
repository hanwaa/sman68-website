"use client";

import { Crown, FileCheck, Medal, Plus, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { achievementPoints, isVerified, levelLabel } from "@/lib/achievement-points";
import type {
  StudentAchievement,
  StudentLeaderboard,
} from "@/components/dashboard/parts/student/types";

const ACHIEVEMENT_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Menunggu verifikasi", className: "bg-amber-100 text-amber-700" },
  draft: { label: "Verifikasi diterima", className: "bg-brand-green/10 text-brand-green" },
  rejected: { label: "Verifikasi gagal", className: "bg-danger-tint text-danger-deep" },
  published: { label: "Verifikasi diterima", className: "bg-brand-green/10 text-brand-green" },
  approved: { label: "Verifikasi diterima", className: "bg-brand-green/10 text-brand-green" },
};

type Props = {
  className?: string;
  achievements: StudentAchievement[];
  leaderboard: StudentLeaderboard | null;
  onCreate: () => void;
  onDownloadCertificate: (achievement: StudentAchievement) => void;
};

export default function AchievementPortfolio({
  className,
  achievements,
  leaderboard,
  onCreate,
  onDownloadCertificate,
}: Props) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">
            Portofolio Prestasi Saya
          </h1>
          <p className="text-muted text-sm">Daftar rekognisi dan penghargaan resmi yang diraih</p>
        </div>
        <button onClick={onCreate} className="btn-primary text-xs px-4 py-2.5 self-start sm:self-auto">
          <Plus size={15} /> Ajukan Prestasi Baru
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-5">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Poin Saya</div>
            <div className="font-display font-extrabold text-2xl text-ink">{leaderboard?.me?.points ?? 0}</div>
            <div className="text-[11px] text-muted">{leaderboard?.me?.total ?? 0} prestasi terverifikasi</div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-lime/30 text-brand-pine flex items-center justify-center flex-shrink-0">
            <Medal size={24} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">
              Peringkat Kelas
            </div>
            <div className="font-display font-extrabold text-2xl text-ink">
              {leaderboard?.me?.classRank ? `#${leaderboard.me.classRank}` : "-"}
            </div>
            <div className="text-[11px] text-muted">
              Kelas {leaderboard?.me?.className ?? className ?? "-"}
            </div>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-pine/10 text-brand-pine flex items-center justify-center flex-shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Poin Kelas</div>
            <div className="font-display font-extrabold text-2xl text-ink">
              {leaderboard?.me?.classPoints ?? 0}
            </div>
            <div className="text-[11px] text-muted">{leaderboard?.me?.classTotal ?? 0} prestasi kelas</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-line">
            <Medal size={16} className="text-brand-green" />
            <h2 className="font-semibold text-ink text-sm">Klasemen Prestasi per Kelas</h2>
          </div>
          {(leaderboard?.classes?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted">Belum ada prestasi terverifikasi. Jadilah yang pertama!</p>
          ) : (
            <ol className="space-y-2.5">
              {leaderboard!.classes.map((cls) => {
                const max = leaderboard!.classes[0]?.points || 1;
                const isMine = cls.className === (leaderboard?.me?.className ?? className);
                return (
                  <li
                    key={cls.className}
                    className={cn("rounded-xl px-3 py-2", isMine && "bg-brand-lime/20 ring-1 ring-brand-lime")}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-2 font-semibold text-ink">
                        <span className={cn("w-5 text-center", cls.rank <= 3 && "text-brand-green")}>
                          #{cls.rank}
                        </span>
                        {cls.className}
                        {isMine && <span className="badge bg-brand-pine text-white text-[9px]">Kelasmu</span>}
                      </span>
                      <span className="text-muted font-semibold">
                        {cls.points} poin · {cls.total} prestasi
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-line overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-green"
                        style={{ width: `${Math.round((cls.points / max) * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-line">
            <Crown size={16} className="text-brand-green" />
            <h2 className="font-semibold text-ink text-sm">Top 10 Siswa Berprestasi</h2>
          </div>
          {(leaderboard?.students?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted">Belum ada data siswa berprestasi.</p>
          ) : (
            <ol className="space-y-2">
              {leaderboard!.students.map((student, index) => (
                <li key={`${student.className}-${student.name}`} className="flex items-center gap-3 text-xs">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center font-bold flex-shrink-0",
                      index === 0 ? "bg-brand-lime text-brand-pine" : "bg-cream text-muted"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 min-w-0 truncate font-semibold text-ink">{student.name}</span>
                  <span className="text-muted flex-shrink-0">{student.className}</span>
                  <span className="font-bold text-brand-green flex-shrink-0">{student.points}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {achievements.map((ach) => {
          const status = ACHIEVEMENT_STATUS[ach.status ?? "pending"] ?? ACHIEVEMENT_STATUS.pending;
          return (
            <div key={ach.id} className="card p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center flex-shrink-0">
                <Trophy size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="badge bg-brand-green/10 text-brand-green text-[10px]">
                    {levelLabel(ach.level)}
                  </span>
                  <span className="text-xs text-muted">{ach.year}</span>
                  <span className={cn("badge text-[10px] font-semibold", status.className)}>
                    {status.label}
                  </span>
                  {isVerified(ach.status) && (
                    <span className="badge bg-brand-lime/40 text-brand-pine text-[10px] font-bold">
                      +{achievementPoints(ach.level)} poin
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-ink text-sm leading-snug mb-1">{ach.title}</h3>
                <div className="text-xs text-muted">{ach.category}</div>
                {isVerified(ach.status) && (
                  <button
                    onClick={() => onDownloadCertificate(ach)}
                    className="mt-3 text-xs font-semibold text-brand-green hover:underline flex items-center gap-1"
                  >
                    <FileCheck size={13} /> Unduh Sertifikat
                  </button>
                )}
                {ach.status === "pending" && (
                  <p className="mt-3 text-[11px] text-muted">
                    Menunggu verifikasi wali kelas/admin. Kamu akan melihat perubahan status di sini.
                  </p>
                )}
                {ach.status === "rejected" && (
                  <p className="mt-3 text-[11px] text-muted">
                    Verifikasi gagal, periksa kembali data/bukti prestasi lalu ajukan ulang.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
