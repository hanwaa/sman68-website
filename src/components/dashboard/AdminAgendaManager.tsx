"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalA11y } from "@/lib/useModalA11y";

type EventRow = {
  id: string;
  title: string;
  category: string;
  start_at: string;
  location: string;
  description: string;
};

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const CATEGORIES = ["Akademik", "Ekskul", "Seremonial", "Kegiatan", "Organisasi", "Rapat"];

const CATEGORY_STYLE: Record<string, string> = {
  Akademik: "bg-brand-pine/10 text-brand-pine",
  Ekskul: "bg-brand-green/10 text-brand-green",
  Seremonial: "bg-brand-green/10 text-brand-green",
  Kegiatan: "bg-brand-leaf/15 text-brand-green",
  Organisasi: "bg-brand-green/10 text-brand-green",
  Rapat: "bg-brand-mist text-brand-green",
};

const JAKARTA_OFFSET = 7 * 3600000;

const jakartaDate = (iso: string) =>
  new Date(new Date(iso).getTime() + JAKARTA_OFFSET).toISOString().slice(0, 10);
const jakartaTime = (iso: string) =>
  new Date(new Date(iso).getTime() + JAKARTA_OFFSET).toISOString().slice(11, 16);
const jakartaInputValue = (iso: string) =>
  new Date(new Date(iso).getTime() + JAKARTA_OFFSET).toISOString().slice(0, 16);

interface AdminAgendaManagerProps {
  onShowToast?: (msg: string) => void;
}

export default function AdminAgendaManager({ onShowToast = () => {} }: AdminAgendaManagerProps) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const now = new Date(Date.now() + JAKARTA_OFFSET);
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date(Date.now() + JAKARTA_OFFSET).toISOString().slice(0, 10)
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    start: "",
    location: "",
    description: "",
  });
  const modalRef = useModalA11y<HTMLDivElement>(modalOpen, () => setModalOpen(false));

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cms?resource=events", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const payload = (await res.json()) as { data?: EventRow[] };
      setEvents(payload.data ?? []);
    } catch {
      setEvents([]);
      onShowToast("Gagal memuat agenda dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const event of events) {
      const key = jakartaDate(event.start_at);
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    map.forEach((list) => {
      list.sort((a, b) => a.start_at.localeCompare(b.start_at));
    });
    return map;
  }, [events]);

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const startOffset = (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7;
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateKey = (day: number) => `${cursor.year}-${pad(cursor.month + 1)}-${pad(day)}`;

  const monthEvents = events.filter((event) => {
    const key = jakartaDate(event.start_at);
    return key.startsWith(`${cursor.year}-${pad(cursor.month + 1)}`);
  });

  const moveMonth = (dir: 1 | -1) => {
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month + dir, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const openCreate = (date?: string) => {
    setEditingId(null);
    setForm({
      title: "",
      category: CATEGORIES[0],
      start: `${date ?? selectedDate}T07:00`,
      location: "",
      description: "",
    });
    setModalOpen(true);
  };

  const openEdit = (event: EventRow) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      category: event.category || CATEGORIES[0],
      start: jakartaInputValue(event.start_at),
      location: event.location ?? "",
      description: event.description ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start) return;
    setSaving(true);

    const values = {
      title: form.title.trim(),
      category: form.category,
      start_at: `${form.start}:00+07:00`,
      location: form.location,
      description: form.description,
    };

    try {
      const res = await fetch("/api/admin/cms?resource=events", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? { id: editingId, values }
            : { values: { id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, ...values } }
        ),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        onShowToast(payload?.error ?? "Gagal menyimpan agenda.");
        return;
      }
      onShowToast(editingId ? "Agenda diperbarui." : "Agenda baru ditambahkan.");
      setSelectedDate(form.start.slice(0, 10));
      setModalOpen(false);
      await load();
    } catch {
      onShowToast("Server tidak terjangkau.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: EventRow) => {
    if (typeof window !== "undefined" && !window.confirm(`Hapus agenda "${event.title}"?`)) return;
    try {
      const res = await fetch(
        `/api/admin/cms?resource=events&id=${encodeURIComponent(event.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      onShowToast("Agenda dihapus.");
      await load();
    } catch {
      onShowToast("Gagal menghapus agenda.");
    }
  };

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const selectedLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-pine text-brand-lime">
            <CalendarDays size={20} aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink md:text-3xl">
              Kelola Agenda Sekolah
            </h1>
            <p className="text-sm text-muted">
              Klik tanggal untuk menambah atau mengubah agenda — tampil di dashboard semua peran.
            </p>
          </div>
        </div>
        <button onClick={() => openCreate()} className="btn-primary btn-sm self-start sm:self-auto">
          <Plus size={14} /> Tambah Agenda
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Kalender */}
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveMonth(-1)}
                className="btn-icon h-8 w-8"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[150px] text-center font-display text-base font-bold text-ink">
                {MONTH_NAMES[cursor.month]} {cursor.year}
              </span>
              <button
                onClick={() => moveMonth(1)}
                className="btn-icon h-8 w-8"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <span className="badge bg-cream font-semibold text-muted">
              {monthEvents.length} agenda bulan ini
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {DAY_LABELS.map((day) => (
              <span key={day} className="text-[10px] font-bold uppercase tracking-wider text-muted">
                {day}
              </span>
            ))}
            {Array.from({ length: startOffset }).map((_, i) => (
              <span key={`blank-${i}`} aria-hidden="true" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = dateKey(day);
              const dayEvents = eventsByDate.get(key) ?? [];
              const active = key === selectedDate;
              const today = key === new Date(Date.now() + JAKARTA_OFFSET).toISOString().slice(0, 10);
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(key)}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-[11px] font-semibold transition-colors",
                    active
                      ? "border-brand-pine bg-brand-pine text-white"
                      : "border-line bg-white text-ink hover:border-brand-green/40 hover:bg-brand-mist",
                    today && !active && "border-brand-green/50"
                  )}
                  aria-label={`${day} ${MONTH_NAMES[cursor.month]} — ${dayEvents.length} agenda`}
                >
                  <span>{day}</span>
                  {dayEvents.length > 0 && (
                    <span className="flex items-center gap-0.5">
                      {dayEvents.slice(0, 3).map((_, index) => (
                        <span
                          key={index}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            active ? "bg-brand-lime" : "bg-brand-green"
                          )}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail tanggal terpilih */}
        <div className="card h-max p-5">
          <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Agenda tanggal
              </div>
              <div className="font-display text-sm font-bold text-ink">{selectedLabel}</div>
            </div>
            <button
              onClick={() => openCreate(selectedDate)}
              className="btn-ghost btn-sm flex-shrink-0"
            >
              <Plus size={13} /> Tambah
            </button>
          </div>

          {loading ? (
            <div className="mt-3 space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-cream" />
              ))}
            </div>
          ) : selectedEvents.length === 0 ? (
            <div className="py-8 text-center">
              <CalendarDays size={24} className="mx-auto mb-2 text-line" aria-hidden="true" />
              <div className="text-xs font-semibold text-ink">Belum ada agenda</div>
              <p className="mt-1 text-[11px] text-muted">
                Klik tombol Tambah untuk membuat agenda di tanggal ini.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {selectedEvents.map((event) => (
                <li key={event.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span
                        className={cn(
                          "badge text-[10px] font-semibold",
                          CATEGORY_STYLE[event.category] ?? "bg-cream text-muted"
                        )}
                      >
                        {event.category}
                      </span>
                      <div className="mt-1.5 text-sm font-semibold text-ink">{event.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={11} aria-hidden="true" /> {jakartaTime(event.start_at)} WIB
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} aria-hidden="true" /> {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEdit(event)}
                        className="btn-icon h-7 w-7"
                        aria-label="Edit agenda"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        className="btn-icon h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Hapus agenda"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={editingId ? "Edit agenda" : "Tambah agenda"}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 text-ink shadow-card focus:outline-none sm:p-6"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="btn-icon absolute right-3 top-3"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
              <h3 className="font-display text-lg font-bold text-ink">
                {editingId ? "Edit Agenda" : "Tambah Agenda"}
              </h3>

              <form onSubmit={handleSave} className="mt-4 space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">
                    Nama Kegiatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    placeholder="Contoh: Upacara Bendera"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink">Kategori</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink">
                      Waktu (WIB) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={form.start}
                      onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                      required
                      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Lokasi</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Contoh: Lapangan"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Deskripsi</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-outline"
                  >
                    Batal
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
