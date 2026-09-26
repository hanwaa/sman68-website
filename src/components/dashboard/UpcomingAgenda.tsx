"use client";

import { CalendarDays, ChevronRight, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContent } from "@/lib/use-content";
import { agendaCatColors, type AgendaEvent } from "@/lib/agenda";

interface UpcomingAgendaProps {
  onNavigate?: (page: string) => void;
}

export default function UpcomingAgenda({ onNavigate }: UpcomingAgendaProps) {
  const events = useContent<AgendaEvent[]>("events", []);
  const eventTime = (event: AgendaEvent) =>
    new Date(`${event.date}T${event.time.replace(".", ":")}:00+07:00`).getTime();
  const upcoming = [...events]
    .filter((event) => eventTime(event) >= Date.now())
    .sort((a, b) => eventTime(a) - eventTime(b))
    .slice(0, 4);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-brand-green" aria-hidden="true" />
          <h2 className="font-semibold text-ink text-sm">Agenda Terdekat</h2>
        </div>
        <button
          onClick={() => onNavigate?.("agenda-sekolah")}
          className="flex items-center gap-0.5 text-xs font-semibold text-brand-green transition-colors hover:text-brand-pine"
        >
          Kalender <ChevronRight size={13} aria-hidden="true" />
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted">Belum ada agenda mendatang.</div>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((event) => (
            <li key={event.id} className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-cream">
                <span className="text-xs font-bold text-ink">
                  {new Date(event.date).getDate()}
                </span>
                <span className="text-[9px] uppercase text-muted">
                  {new Date(event.date).toLocaleDateString("id-ID", { month: "short" })}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{event.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                  <span
                    className={cn(
                      "badge border text-[9px]",
                      agendaCatColors[event.category] ?? "bg-cream text-muted"
                    )}
                  >
                    {event.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} aria-hidden="true" /> {event.time}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={10} aria-hidden="true" /> {event.location}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
