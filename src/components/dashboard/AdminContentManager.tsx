"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MODAL_PANEL, MODAL_TRANSITION } from "@/lib/motion";
import {
  Calendar,
  Camera,
  ChevronRight,
  ClipboardList,
  Database,
  GraduationCap,
  HelpCircle,
  Images,
  Image as ImageIcon,
  LayoutGrid,
  Map as MapIcon,
  Megaphone,
  MessageSquareQuote,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  School,
  Search,
  Star,
  Trash2,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalA11y } from "@/lib/useModalA11y";
import { uploadToR2 } from "@/lib/upload";
import { CMS_RESOURCES, cmsResourceById, type CmsDynamicSource, type CmsField } from "@/lib/cms";
import { ekskulList } from "@/lib/ekskul";

type Row = Record<string, unknown>;

type SelectOption = { value: string; label: string };

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  news: Newspaper,
  achievements: Trophy,
  extracurriculars: Star,
  facilities: MapIcon,
  testimonials: MessageSquareQuote,
  faqs: HelpCircle,
  events: Calendar,
  announcements: Megaphone,
  alumni: GraduationCap,
  universities: School,
  gallery_albums: Images,
  gallery_photos: Camera,
  hero_slides: Images,
  facility_highlights: LayoutGrid,
  people_photos: Camera,
  ppdb_config: ClipboardList,
};

const STATUS_STYLES: Record<string, string> = {
  published: "bg-brand-green/10 text-brand-green",
  approved: "bg-brand-green/10 text-brand-green",
  Aktif: "bg-brand-green/10 text-brand-green",
  pending: "bg-amber-100 text-amber-700",
  draft: "bg-line text-muted",
  Nonaktif: "bg-line text-muted",
  rejected: "bg-danger-tint text-danger-deep",
  archived: "bg-danger-tint text-danger-deep",
};

const formatCell = (value: unknown) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    return new Date(text).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return text.length > 48 ? `${text.slice(0, 48)}...` : text;
};

const toInputValue = (field: CmsField, value: unknown) => {
  if (value === null || value === undefined) return "";
  if (field.type === "datetime") return String(value).slice(0, 16);
  if (field.type === "images" || field.type === "list") {
    return Array.isArray(value) ? value.join("\n") : String(value);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const galleryLines = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const generateUniqueId = (resourceId: string) =>
  `${resourceId.replace(/_/g, "-")}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

interface AdminContentManagerProps {
  onShowToast?: (msg: string) => void;
}

export default function AdminContentManager({ onShowToast = () => {} }: AdminContentManagerProps) {
  const [resourceId, setResourceId] = useState(CMS_RESOURCES[0].id);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  // Opsi select dinamis per sumber (diambil live dari database + fallback).
  const [dynOptions, setDynOptions] = useState<Record<CmsDynamicSource, SelectOption[]>>({
    ekskul: [],
    achievement: [],
    album: [],
  });
  const modalRef = useModalA11y<HTMLDivElement>(modalOpen, () => setModalOpen(false));

  const resource = cmsResourceById(resourceId) ?? CMS_RESOURCES[0];
  const imageField = resource.fields.find((field) => field.type === "image");
  const ResourceIcon = RESOURCE_ICONS[resource.id] ?? Database;

  const load = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cms?resource=${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const payload = (await res.json()) as { data?: Row[] };
      setRows(payload.data ?? []);
    } catch {
      setRows([]);
      onShowToast("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch("");
    void load(resourceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  // Muat opsi select dinamis sekali (paralel, payload kecil). Endpoint admin
  // dipakai agar baris draft ikut tampil (API publik hanya yang published).
  useEffect(() => {
    let cancelled = false;
    const text = (value: unknown) => String(value ?? "").trim();
    const cmsRows = async (resource: string): Promise<Row[]> => {
      try {
        const res = await fetch(`/api/admin/cms?resource=${resource}`, { cache: "no-store" });
        if (!res.ok) return [];
        const payload = (await res.json()) as { data?: Row[] };
        return Array.isArray(payload.data) ? payload.data : [];
      } catch {
        return [];
      }
    };
    (async () => {
      const [ekskulRows, achievementRows, albumRows] = await Promise.all([
        cmsRows("extracurriculars"),
        cmsRows("achievements"),
        cmsRows("gallery_albums"),
      ]);
      if (cancelled) return;
      const opt = (value: string, label: string): SelectOption | null =>
        value && label ? { value, label } : null;
      const compact = (list: (SelectOption | null)[]): SelectOption[] =>
        list.filter((item): item is SelectOption => item !== null);
      const ekskulLive = compact(
        ekskulRows.map((row) => opt(text(row.id), text(row.name)))
      );
      setDynOptions({
        ekskul:
          ekskulLive.length > 0
            ? ekskulLive
            : ekskulList.map((item) => ({ value: item.id, label: item.name })),
        achievement: compact(
          achievementRows.map((row) => opt(text(row.id), text(row.title)))
        ),
        album: compact(albumRows.map((row) => opt(text(row.id), text(row.title)))),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Resolve opsi select: dinamis (optionsFrom) atau statis (options). */
  const selectOptions = (field: CmsField): SelectOption[] => {
    if (field.optionsFrom) return dynOptions[field.optionsFrom] ?? [];
    return (field.options ?? []).map((option) => ({ value: option, label: option }));
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      resource.listColumns.some((col) =>
        String(row[col.name] ?? "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [rows, search, resource.listColumns]);

  const handleImageUpload = async (field: CmsField, file: File | undefined) => {
    if (!file) return;
    setUploadingField(field.name);
    try {
      const uploaded = await uploadToR2(file, `cms/${resource.id}`);
      const url = uploaded.publicUrl ?? uploaded.key;
      setForm((prev) => ({ ...prev, [field.name]: url }));
      onShowToast(`Gambar "${file.name}" diunggah ke penyimpanan.`);
    } catch {
      onShowToast("Gagal mengunggah gambar. Periksa konfigurasi R2.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleGalleryUpload = async (field: CmsField, file: File | undefined) => {
    if (!file) return;
    setUploadingField(field.name);
    try {
      const uploaded = await uploadToR2(file, `cms/${resource.id}`);
      const url = uploaded.publicUrl ?? uploaded.key;
      setForm((prev) => {
        const current = (prev[field.name] ?? "").trim();
        return { ...prev, [field.name]: current ? `${current}\n${url}` : url };
      });
      onShowToast(`Gambar "${file.name}" ditambahkan ke galeri.`);
    } catch {
      onShowToast("Gagal mengunggah gambar. Periksa konfigurasi R2.");
    } finally {
      setUploadingField(null);
    }
  };

  const openCreate = () => {
    const initial: Record<string, string> = {};
    resource.fields.forEach((field) => {
      if (field.name === resource.primaryKey) {
        // ID dibuat otomatis & unik agar tidak bentrok
        initial[field.name] = generateUniqueId(resource.id);
        return;
      }
      initial[field.name] =
        field.type === "select" ? (field.optionsFrom ? "" : (field.options?.[0] ?? "")) : "";
    });
    setForm(initial);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: Row) => {
    const initial: Record<string, string> = {};
    resource.fields.forEach((field) => {
      initial[field.name] = toInputValue(field, row[field.name]);
    });
    setForm(initial);
    setEditing(row);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const values: Record<string, unknown> = {};
    resource.fields.forEach((field) => {
      const raw = form[field.name];
      if (raw === undefined) return;
      values[field.name] = raw;
    });

    try {
      const isEdit = Boolean(editing);
      const res = await fetch(`/api/admin/cms?resource=${resource.id}`, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { id: String(editing?.[resource.primaryKey]), values } : { values }
        ),
      });
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        onShowToast(payload?.error ?? "Gagal menyimpan data.");
        return;
      }
      onShowToast(
        isEdit ? `${resource.label} berhasil diperbarui.` : `${resource.label} baru ditambahkan.`
      );
      setModalOpen(false);
      await load(resourceId);
    } catch {
      onShowToast("Server tidak terjangkau.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Row) => {
    const label = String(row[resource.listColumns[0]?.name] ?? "data ini");
    if (typeof window !== "undefined" && !window.confirm(`Hapus "${label}"?`)) return;
    try {
      const res = await fetch(
        `/api/admin/cms?resource=${resource.id}&id=${encodeURIComponent(
          String(row[resource.primaryKey])
        )}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      onShowToast(`${resource.label} dihapus.`);
      await load(resourceId);
    } catch {
      onShowToast("Gagal menghapus data.");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[230px_1fr]">
      {/* Sidebar: daftar data */}
      <aside className="card h-max overflow-hidden p-0 lg:sticky lg:top-4">
        <div className="flex items-center gap-2 border-b border-line bg-cream/60 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-pine text-brand-lime">
            <Database size={14} aria-hidden="true" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
            Daftar Data
          </span>
          <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-muted">
            {CMS_RESOURCES.length}
          </span>
        </div>
        <nav className="max-h-[62vh] space-y-0.5 overflow-y-auto p-2" aria-label="Daftar data">
          {CMS_RESOURCES.map((item) => {
            const active = resourceId === item.id;
            const Icon = RESOURCE_ICONS[item.id] ?? Database;
            return (
              <button
                key={item.id}
                onClick={() => setResourceId(item.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-pine text-white"
                    : "text-ink/70 hover:bg-cream hover:text-ink"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-white/10 text-brand-lime"
                      : "bg-cream text-muted group-hover:bg-white group-hover:text-brand-green"
                  )}
                >
                  <Icon size={14} aria-hidden="true" />
                </span>
                <span className="truncate text-left">{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto flex-shrink-0 text-white/60" />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Panel data */}
      <div className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-pine text-brand-lime">
              <ResourceIcon size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink">{resource.label}</h2>
              <p className="text-xs text-muted">
                {loading ? "Memuat data..." : `${filteredRows.length} dari ${rows.length} data`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(resourceId)}
              className="btn-outline btn-sm"
              aria-label="Muat ulang data"
            >
              <RefreshCw size={13} className={cn(loading && "animate-spin")} /> Muat Ulang
            </button>
            {!resource.singleton && (
              <button onClick={openCreate} className="btn-primary btn-sm">
                <Plus size={14} /> Tambah
              </button>
            )}
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Cari ${resource.label.toLowerCase()}...`}
            className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="space-y-2 py-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-cream" />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-12 text-center">
              <Database size={28} className="mx-auto mb-3 text-line" aria-hidden="true" />
              <div className="text-sm font-semibold text-ink">
                {rows.length === 0 ? `Belum ada data ${resource.label}` : "Tidak ada yang cocok"}
              </div>
              <p className="mt-1 text-xs text-muted">
                {rows.length === 0
                  ? "Tambahkan data pertama untuk mulai mengelola konten."
                  : "Coba kata kunci lain."}
              </p>
              {rows.length === 0 && !resource.singleton && (
                <button onClick={openCreate} className="btn-primary btn-sm mt-4">
                  <Plus size={14} /> Tambah {resource.label}
                </button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
                  {imageField && <th className="w-14 px-3 py-2.5 font-semibold">Gambar</th>}
                  {resource.listColumns.map((col) => (
                    <th key={col.name} className="px-3 py-2.5 font-semibold">
                      {col.label}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredRows.map((row) => (
                  <tr key={String(row[resource.primaryKey])} className="group hover:bg-cream/60">
                    {imageField && (
                      <td className="px-3 py-2">
                        {row[imageField.name] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={String(row[imageField.name])}
                            alt=""
                            className="h-9 w-9 rounded-lg border border-line object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream text-line">
                            <ImageIcon size={14} aria-hidden="true" />
                          </span>
                        )}
                      </td>
                    )}
                    {resource.listColumns.map((col) => (
                      <td key={col.name} className="px-3 py-2.5 text-ink">
                        {col.name === "status" && STATUS_STYLES[String(row[col.name])] ? (
                          <span
                            className={cn(
                              "badge text-[10px] font-semibold capitalize",
                              STATUS_STYLES[String(row[col.name])]
                            )}
                          >
                            {String(row[col.name])}
                          </span>
                        ) : (
                          formatCell(row[col.name])
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => openEdit(row)}
                          className="btn-icon h-8 w-8"
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        {!resource.singleton && (
                          <button
                            onClick={() => handleDelete(row)}
                            className="btn-icon h-8 w-8 text-danger-deep hover:bg-danger-tint hover:text-danger-deep"
                            aria-label="Hapus"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              transition={MODAL_TRANSITION}
              className="absolute inset-0 bg-brand-pine/70"
            />
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={`${editing ? "Edit" : "Tambah"} ${resource.label}`}
              initial={MODAL_PANEL.initial}
              animate={MODAL_PANEL.animate}
              exit={MODAL_PANEL.exit}
              transition={MODAL_TRANSITION}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 text-ink shadow-card focus:outline-none sm:p-6"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="btn-icon absolute right-3 top-3"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
              <h3 className="font-display text-lg font-bold text-ink">
                {editing ? `Edit ${resource.label}` : `Tambah ${resource.label}`}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {editing
                  ? "Perbarui data lalu simpan perubahan."
                  : "Isi kolom bertanda * lalu simpan."}
              </p>

              <form onSubmit={handleSave} className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {resource.fields.map((field) => {
                  const value = form[field.name] ?? "";
                  const wide =
                    field.type === "textarea" || field.type === "image" || field.type === "images";
                  const isPrimaryKey = field.name === resource.primaryKey;
                  const common =
                    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30";
                  return (
                    <div key={field.name} className={cn(wide && "sm:col-span-2")}>
                      <label className="mb-1 block text-xs font-semibold text-ink">
                        {field.label}
                        {field.required && <span className="text-danger-deep"> *</span>}
                      </label>
                      {isPrimaryKey ? (
                        <div>
                          <input
                            value={value}
                            readOnly
                            aria-readonly="true"
                            className={cn(common, "cursor-not-allowed bg-cream/60 text-muted")}
                          />
                          <p className="mt-1 text-[10px] text-muted">
                            ID dibuat otomatis &amp; unik, tidak perlu diisi.
                          </p>
                        </div>
                      ) : field.type === "image" ? (
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            {value ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={value}
                                alt=""
                                className="h-16 w-16 flex-shrink-0 rounded-lg border border-line object-cover"
                              />
                            ) : (
                              <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-line text-muted">
                                <ImageIcon size={18} aria-hidden="true" />
                              </span>
                            )}
                            <div className="min-w-0 flex-1 space-y-2">
                              <label className="btn-outline btn-sm cursor-pointer">
                                <Upload size={13} />
                                {uploadingField === field.name
                                  ? "Mengunggah..."
                                  : value
                                  ? "Ganti Gambar"
                                  : "Unggah Gambar"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    void handleImageUpload(field, e.target.files?.[0]);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                              <input
                                type="text"
                                value={value}
                                placeholder="atau tempel URL/path gambar"
                                onChange={(e) =>
                                  setForm((prev) => ({ ...prev, [field.name]: e.target.value }))
                                }
                                className={common}
                              />
                            </div>
                          </div>
                          {value && (
                            <button
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, [field.name]: "" }))}
                              className="text-[11px] font-semibold text-danger-deep hover:underline"
                            >
                              Hapus gambar
                            </button>
                          )}
                        </div>
                      ) : field.type === "images" ? (
                        <div className="space-y-2.5">
                          <textarea
                            rows={4}
                            placeholder={"Satu URL/path per baris, mis.\n/assets/fasilitas/lantai-1/ruang-kelas/1.webp"}
                            value={value}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, [field.name]: e.target.value }))
                            }
                            className={cn(common, "resize-y font-mono text-xs")}
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <label className="btn-outline btn-sm cursor-pointer">
                              <Upload size={13} />
                              {uploadingField === field.name ? "Mengunggah..." : "Tambah Foto"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  void handleGalleryUpload(field, e.target.files?.[0]);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <span className="text-[11px] text-muted">
                              {galleryLines(value).length} foto · hapus baris untuk mengurangi
                            </span>
                          </div>
                          {galleryLines(value).length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {galleryLines(value).map((src, index) => (
                                <span
                                  key={`${src}-${index}`}
                                  className="relative h-14 w-14 overflow-hidden rounded-lg border border-line"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setForm((prev) => ({
                                        ...prev,
                                        [field.name]: galleryLines(prev[field.name] ?? "")
                                          .filter((_, itemIndex) => itemIndex !== index)
                                          .join("\n"),
                                      }))
                                    }
                                    aria-label="Hapus foto"
                                    className="absolute right-0.5 top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-danger-deep"
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : field.type === "textarea" || field.type === "list" ? (
                        <textarea
                          rows={field.type === "list" ? 4 : 3}
                          required={field.required}
                          placeholder={field.placeholder}
                          value={value}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [field.name]: e.target.value }))
                          }
                          className={cn(common, "resize-none")}
                        />
                      ) : field.type === "checkbox" ? (
                        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-white px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={value === "true"}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                [field.name]: String(e.target.checked),
                              }))
                            }
                            className="h-4 w-4 shrink-0 accent-brand-green"
                          />
                          <span className="text-sm font-semibold text-ink">
                            {value === "true" ? "Ya" : "Tidak"}
                          </span>
                        </label>
                      ) : field.type === "select" ? (
                        <select
                          value={value}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [field.name]: e.target.value }))
                          }
                          className={common}
                        >
                          {(() => {
                            const opts = selectOptions(field);
                            // Nilai lama yang tak ada di daftar (mis. ekskul yang
                            // sudah dihapus) tetap ditampilkan agar tak hilang saat simpan.
                            const rows =
                              value && !opts.some((o) => o.value === value)
                                ? [...opts, { value, label: `${value} (tak terdaftar)` }]
                                : opts;
                            return (
                              <>
                                {!field.required && (
                                  <option value="">, Kosongkan,</option>
                                )}
                                {rows.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </>
                            );
                          })()}
                        </select>
                      ) : (
                        <input
                          type={
                            field.type === "number"
                              ? "number"
                              : field.type === "datetime"
                              ? "datetime-local"
                              : "text"
                          }
                          required={field.required}
                          placeholder={field.placeholder}
                          value={value}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [field.name]: e.target.value }))
                          }
                          className={common}
                        />
                      )}
                    </div>
                  );
                })}

                <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
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
