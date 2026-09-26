"use client";

import { Clock } from "lucide-react";

export default function AttendancePhoto({ url, name }: { url?: string | null; name: string }) {
  if (!url) {
    return (
      <div className="w-11 h-11 rounded-xl bg-line flex items-center justify-center flex-shrink-0">
        <Clock size={16} className="text-muted" aria-hidden="true" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Foto absensi ${name}`}
      className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
    />
  );
}
