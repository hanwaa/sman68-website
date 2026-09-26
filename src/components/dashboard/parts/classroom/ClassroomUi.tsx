"use client";

import { cn } from "@/lib/utils";

export function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-xs font-bold text-brand-green",
        className
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function StatusBadge({ status }: { status: "assigned" | "turned_in" | "graded" }) {
  const map = {
    assigned: { label: "Belum dikumpulkan", className: "bg-line text-muted" },
    turned_in: { label: "Terkumpul", className: "bg-brand-green/10 text-brand-green" },
    graded: { label: "Sudah dinilai", className: "bg-brand-pine/10 text-brand-pine" },
  } as const;
  const meta = map[status];
  return <span className={cn("badge text-[10px] font-semibold", meta.className)}>{meta.label}</span>;
}
