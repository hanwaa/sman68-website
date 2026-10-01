"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, List } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  MONTHS,
  DAYS,
  agendaCatColors as catColors,
  type AgendaEvent,
} from "@/lib/agenda";
import { useContent } from "@/lib/use-content";

export default function SchoolAgenda() {
  const events = useContent<AgendaEvent[]>("events", []);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const jakartaToday = new Date(Date.now() + 7 * 3600000);
  const todayKey = jakartaToday.toISOString().slice(0, 10);
  const viewDate = new Date(
    jakartaToday.getUTCFullYear(),
    jakartaToday.getUTCMonth() + monthOffset,
    1
  );
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const eventTime = (event: AgendaEvent) =>
    new Date(`${event.date}T${event.time.replace(".", ":")}:00+07:00`).getTime();

  const upcoming = events
    .filter((event) => eventTime(event) >= Date.now())
    .sort((a, b) => eventTime(a) - eventTime(b))
    .slice(0, 5);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const eventsOnDate = (dateStr: string) => events.filter((e) => e.date === dateStr);
  const selectedEvents = selectedDate ? eventsOnDate(selectedDate) : [];

  const toDateStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prevMonth = () => setMonthOffset((o) => o - 1);
  const nextMonth = () => setMonthOffset((o) => o + 1);
  const goToToday = () => setMonthOffset(0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink">
            Agenda Sekolah
          </h1>
          <p className="text-muted text-sm">
            Jadwal kegiatan, ujian, ekskul, dan event penting dalam satu kalender terpadu.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("calendar")} className={cn("chip", view === "calendar" && "chip-active")}>
            <Calendar size={14} /> Kalender
          </button>
          <button onClick={() => setView("list")} className={cn("chip", view === "list" && "chip-active")}>
            <List size={14} /> List
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button onClick={prevMonth} className="btn-icon" aria-label="Bulan sebelumnya">
          <ChevronLeft size={16} />
        </button>
        <h2 className="font-display font-bold text-xl text-ink min-w-[10rem] text-center">
          {MONTHS[currentMonth]} {currentYear}
        </h2>
        <button onClick={nextMonth} className="btn-icon" aria-label="Bulan berikutnya">
          <ChevronRight size={16} />
        </button>
        {monthOffset !== 0 && (
          <button
            onClick={goToToday}
            className="btn-ghost text-xs"
          >
            Kembali ke bulan ini
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {view === "calendar" ? (
            <div className="card p-4">
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = toDateStr(day);
                  const dayEvents = eventsOnDate(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === todayKey;
                  return (
                    <motion.button
                      key={day}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={cn(
                        "relative min-h-[52px] rounded-xl p-1.5 text-left transition-colors duration-200 ease-out",
                        isSelected ? "bg-brand-pine" : isToday ? "bg-brand-green/10 border border-brand-green" : "hover:bg-cream"
                      )}
                    >
                      <span className={cn("text-xs font-semibold block mb-1", isSelected ? "text-white" : isToday ? "text-brand-green" : "text-ink")}>
                        {day}
                      </span>
                      <div className="flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 2).map((e) => (
                          <div key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                        ))}
                        {dayEvents.length > 2 && <div className="text-[8px] text-muted">+{dayEvents.length - 2}</div>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: event.color }}>
                    <span className="text-xs font-bold">{new Date(event.date).getDate()}</span>
                    <span className="text-[9px]">{MONTHS[new Date(event.date).getMonth()].slice(0, 3)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`badge border mb-1 ${catColors[event.category]}`}>{event.category}</span>
                    <div className="font-semibold text-ink text-sm truncate">{event.title}</div>
                    <div className="flex items-center gap-3 text-xs text-muted mt-0.5">
                      <span className="flex items-center gap-1"><Clock size={10} />{event.time}</span>
                      <span className="flex items-center gap-1"><MapPin size={10} />{event.location}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <AnimatePresence mode="wait">
            {selectedDate && selectedEvents.length > 0 ? (
              <motion.div key={selectedDate} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="card p-5">
                <h3 className="font-semibold text-ink text-sm mb-4 flex items-center gap-2">
                  <Calendar size={15} className="text-brand-green" />
                  {formatDate(selectedDate)}
                </h3>
                <div className="space-y-3">
                  {selectedEvents.map((e) => (
                    <div key={e.id} className="p-3 rounded-xl" style={{ backgroundColor: e.color + "15", border: `1px solid ${e.color}30` }}>
                      <span className={`badge border mb-1.5 ${catColors[e.category]}`}>{e.category}</span>
                      <div className="font-semibold text-ink text-sm">{e.title}</div>
                      <div className="flex items-center gap-3 text-xs text-muted mt-1">
                        <span className="flex items-center gap-1"><Clock size={10} />{e.time}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} />{e.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
                <h3 className="font-semibold text-ink text-sm mb-4">Agenda Mendatang</h3>
                {upcoming.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted">
                    Belum ada agenda mendatang.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcoming.map((e) => (
                    <div key={e.id} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{e.title}</div>
                        <div className="text-xs text-muted">{formatDate(e.date, { day: "numeric", month: "short" })} · {e.time}</div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="card p-5 mt-4">
            <h3 className="font-semibold text-ink text-sm mb-3">Kategori</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(catColors).map(([cat, cls]) => (
                <span key={cat} className={`badge border text-[10px] ${cls}`}>{cat}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
