"use client";

import { Check, RefreshCw, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClassRequest, ClassroomClass } from "@/lib/classroom";
import { Avatar } from "@/components/dashboard/parts/classroom/ClassroomUi";

type Props = {
  activeClass: ClassroomClass;
  refreshing: boolean;
  onRefresh: () => void;
  onApprove: (request: ClassRequest) => void;
  onReject: (request: ClassRequest) => void;
};

export default function RequestsTab({ activeClass, refreshing, onRefresh, onApprove, onReject }: Props) {
  return (
    <div className="mt-5">
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-ink">Permintaan Bergabung</h2>
            <p className="text-xs text-muted">
              Setujui siswa untuk masuk ke {activeClass.name} {activeClass.section}.
            </p>
          </div>
          <button onClick={onRefresh} disabled={refreshing} className="btn-ghost text-xs">
            <RefreshCw size={13} className={cn(refreshing && "animate-spin")} /> Muat Ulang
          </button>
        </div>

        {activeClass.requests.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-cream">
              <UserPlus size={20} className="text-muted" aria-hidden="true" />
            </div>
            <div className="text-sm font-semibold text-ink">Belum ada permintaan</div>
            <div className="mt-1 text-xs text-muted">
              Permintaan muncul saat siswa memasukkan kode kelas.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {activeClass.requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar initials={request.initials} />
                  <div>
                    <div className="text-sm font-semibold text-ink">{request.name}</div>
                    <div className="text-[11px] text-muted">Mengajukan {request.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button onClick={() => onReject(request)} className="btn-danger text-xs">
                    <X size={13} /> Tolak
                  </button>
                  <button onClick={() => onApprove(request)} className="btn-primary text-xs">
                    <Check size={13} /> Setujui
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
