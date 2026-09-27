"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { A11yOverlay } from "@/components/ui/A11yOverlay";
import { Building2, GraduationCap, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalA11y } from "@/lib/useModalA11y";
import { useContent } from "@/lib/use-content";
import {
  CAREER_FIELDS,
  fieldStyle,
  universityLogos,
  type CareerField,
} from "@/lib/alumni-career";

const AlumniCampusMap = dynamic(() => import("@/components/features/AlumniCampusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-brand-mist/60 text-sm text-muted">
      Memuat peta…
    </div>
  ),
});

const ALL = "Semua";
const VISIBLE_LIMIT = 6;

/** Inisial nama untuk avatar cadangan saat alumni belum punya foto. */
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

type AlumniRow = {
  id: string;
  name: string;
  graduationYear: number | null;
  photo: string;
  jobTitle: string;
  company: string;
  cityId: string;
  linkedin: string;
  bio: string;
  field: string;
  universityId: string | null;
  universityName: string | null;
  universityLogo: string | null;
};

type AlumniDisplay = {
  id: string;
  name: string;
  angkatan: string;
  university: string;
  role: string;
  company: string;
  cityId: string;
  field: CareerField;
  photo: string;
  linkedin: string;
  bio: string;
};

const toDisplay = (a: AlumniRow): AlumniDisplay => ({
  id: a.id,
  name: a.name,
  angkatan: a.graduationYear == null ? "—" : String(a.graduationYear),
  university: a.universityName ?? "",
  role: a.jobTitle,
  company: a.company,
  cityId: a.cityId,
  field: a.field as CareerField,
  photo: a.photo,
  linkedin: a.linkedin,
  bio: a.bio,
});

export default function AlumniCareerMap() {
  const alumniRows = useContent<AlumniRow[]>("alumni", []);
  const alumniCareer = useMemo(() => alumniRows.map(toDisplay), [alumniRows]);
  const alumniUniversities = useMemo(
    () => Array.from(new Set(alumniCareer.map((a) => a.university))).filter(Boolean),
    [alumniCareer]
  );

  const [field, setField] = useState<CareerField | typeof ALL>(ALL);
  const [university, setUniversity] = useState<string | null>(null);
  const [selected, setSelected] = useState<AlumniDisplay | null>(null);
  const modalRef = useModalA11y<HTMLDivElement>(!!selected, () => setSelected(null));

  const filtered = useMemo(
    () =>
      alumniCareer.filter(
        (a) => (field === ALL || a.field === field) && (!university || a.university === university)
      ),
    [alumniCareer, field, university]
  );

  const visibleAlumni = useMemo(() => filtered.slice(0, VISIBLE_LIMIT), [filtered]);

  const campusCount = (name: string) =>
    alumniCareer.filter((a) => a.university === name && (field === ALL || a.field === field)).length;

  const campuses = useMemo(
    () =>
      alumniUniversities
        .map((name) => ({ name, count: campusCount(name) }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "id")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alumniCareer, alumniUniversities, field]
  );

  const counts = useMemo(
    () => Object.fromEntries(alumniUniversities.map((name) => [name, campusCount(name)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alumniCareer, alumniUniversities, field]
  );

  /** Logo kampus: pakai dari data alumni (R2/DB), fallback ke aset statis. */
  const campusLogos = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of alumniRows) {
      if (row.universityName && row.universityLogo && !map[row.universityName]) {
        map[row.universityName] = row.universityLogo;
      }
    }
    for (const [name, logo] of Object.entries(universityLogos)) {
      if (!map[name]) map[name] = logo;
    }
    return map;
  }, [alumniRows]);

  const stats = [
    { value: `${alumniCareer.length}`, label: "Alumni terdata" },
    { value: `${alumniUniversities.length}`, label: "Kampus alumni" },
    { value: `${CAREER_FIELDS.length}`, label: "Bidang karier" },
  ];

  const toggleCampus = (name: string) =>
    setUniversity((prev) => (prev === name ? null : name));

  const resetFilters = () => {
    setField(ALL);
    setUniversity(null);
  };

  return (
    <section
      id="peta-karier"
      className="container-custom pt-10 scroll-mt-24"
      aria-label="Peta karier alumni per kampus"
    >
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-green bg-brand-green/10 rounded-full px-3 py-1 mb-3">
            <GraduationCap size={12} aria-hidden="true" />
            Alumni Career Map
          </span>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-ink">
            Dari Kampus ke <span className="text-brand-leaf">Karier</span>
          </h2>
          <p className="text-muted text-sm md:text-base mt-2 leading-relaxed">
            Klik kampus untuk melihat alumninya — dari kampus di Indonesia sampai Belanda dan
            Australia.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-3 sm:gap-6 flex-shrink-0">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display font-extrabold text-xl md:text-2xl text-brand-pine tabular-nums">
                {s.value}
              </dd>
              <dd className="text-muted text-[11px] mt-0.5">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-2xl border border-line bg-white p-4 md:p-6 shadow-card">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter bidang karier"
        >
          {[ALL, ...CAREER_FIELDS].map((f) => (
            <button
              key={f}
              onClick={() => setField(f as CareerField | typeof ALL)}
              aria-pressed={field === f}
              className={cn(
                "chip whitespace-nowrap",
                field === f && "chip-active"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-5 grid lg:grid-cols-[1fr_320px] gap-5">
          <div className="rounded-2xl border border-line bg-brand-mist/40 p-2 sm:p-3">
            <div className="relative rounded-xl overflow-hidden">
              <div className="relative isolate z-0 h-[320px] sm:h-[400px] lg:h-[460px]">
                <AlumniCampusMap
                  counts={counts}
                  selectedName={university}
                  onSelect={toggleCampus}
                />
              </div>
              <div className="absolute top-3 left-3 z-[1000] pointer-events-none hidden sm:flex items-center gap-2 rounded-full bg-white/95 backdrop-blur border border-line px-3 py-1.5 text-[10px] text-muted shadow-card">
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white border border-line text-[8px] font-bold text-ink" aria-hidden="true">
                  n
                </span>
                angka pada ikon = jumlah alumni per kampus
              </div>
            </div>
            <p className="text-xs text-muted mt-3 px-1">
              Klik ikon kampus di peta untuk menyaring alumni — ikon memakai logo kampus, angka
              kecil menunjukkan jumlah alumni.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-cream/60 p-3 flex flex-col min-h-0 h-full">
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="font-display font-bold text-ink text-sm">Jelajahi Kampus</h3>
              {university && (
                <button
                  onClick={() => setUniversity(null)}
                  className="text-[11px] font-semibold text-brand-green hover:underline"
                >
                  Semua kampus
                </button>
              )}
            </div>
            <div
              className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 max-h-[344px] lg:max-h-none lg:min-h-0 lg:flex-1"
              role="group"
              aria-label="Filter kampus alumni"
            >
              {campuses.map((campus) => {
                const active = university === campus.name;
                const logo = campusLogos[campus.name];
                return (
                  <button
                    key={campus.name}
                    onClick={() => toggleCampus(campus.name)}
                    aria-pressed={active}
                    aria-label={`${campus.name} — ${campus.count} alumni`}
                    className={cn(
                      "group relative flex h-20 items-center justify-center overflow-hidden rounded-xl border bg-white transition-all duration-200",
                      active
                        ? "border-brand-pine ring-2 ring-brand-pine/20"
                        : "border-line hover:-translate-y-0.5 hover:border-brand-leaf/40 hover:shadow-card-hover"
                    )}
                  >
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        className="h-10 w-full px-3 object-contain"
                      />
                    ) : (
                      <span
                        className="font-display text-xs font-extrabold text-brand-green"
                        aria-hidden="true"
                      >
                        {initials(campus.name)}
                      </span>
                    )}
                    <span
                      className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-brand-pine/95 px-1.5 text-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100",
                        active && "opacity-100"
                      )}
                      aria-hidden="true"
                    >
                      <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-white">
                        {campus.name}
                      </span>
                      <span className="text-[9px] font-bold text-brand-lime">
                        {campus.count} alumni
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted" aria-live="polite">
            Menampilkan <strong className="text-ink">{filtered.length}</strong> alumni
            {university ? (
              <>
                {" "}
                dari <strong className="text-ink">{university}</strong>
              </>
            ) : null}
            {field !== ALL ? (
              <>
                {" "}
                bidang <strong className="text-ink">{field}</strong>
              </>
            ) : null}
          </p>
          <div className="flex items-center gap-4">
            {(field !== ALL || university) && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-brand-green hover:underline"
              >
                Reset filter
              </button>
            )}
            <a href="#direktori" className="text-xs font-semibold text-brand-green hover:underline">
              Lihat direktori lengkap
            </a>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {visibleAlumni.map((a, i) => {
              return (
                <motion.div
                  layout
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.2) }}
                >
                  <button
                    onClick={() => setSelected(a)}
                    className="group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-brand-pine text-left sm:aspect-[4/3]"
                    aria-label={`Lihat detail ${a.name}`}
                  >
                    {a.photo ? (
                      <Image
                        src={a.photo}
                        alt={a.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                      />
                    ) : (
                      <span
                        className="absolute inset-0 flex items-center justify-center font-display text-3xl font-extrabold text-brand-lime"
                        aria-hidden="true"
                      >
                        {initials(a.name)}
                      </span>
                    )}
                    <span
                      className="absolute inset-0 bg-gradient-to-t from-brand-pine/95 via-brand-pine/45 to-brand-pine/10"
                      aria-hidden="true"
                    />
                    <span className="absolute inset-x-0 bottom-0 p-4">
                      <span className="block font-display text-base font-bold leading-snug text-white line-clamp-2 group-hover:underline decoration-brand-lime/60 decoration-2 underline-offset-4 sm:text-sm">
                        {a.name}
                      </span>
                      <span className="mt-1.5 block truncate text-xs text-white/85 sm:text-[11px] sm:text-white/80">
                        {a.role}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70 sm:text-[11px] sm:text-white/60">
                        <GraduationCap size={12} className="shrink-0" aria-hidden="true" />
                        <span className="truncate">{a.university}</span>
                      </span>
                      <span className="mt-2 inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/90 backdrop-blur sm:px-2 sm:py-0.5 sm:text-[9px]">
                        {a.field}
                      </span>
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-cream border border-line flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={24} className="text-muted" aria-hidden="true" />
            </div>
            <div className="font-semibold text-ink">Belum ada alumni pada kombinasi ini</div>
            <div className="text-muted text-sm mt-1">Coba pilih kampus atau bidang lain</div>
          </div>
        )}

        {filtered.length > VISIBLE_LIMIT && (
          <p className="mt-4 text-xs text-muted">
            Menampilkan {visibleAlumni.length} dari {filtered.length} alumni pada filter ini —{" "}
            <a href="#direktori" className="font-semibold text-brand-green hover:underline">
              lihat semua di direktori
            </a>
            .
          </p>
        )}
      </div>

      <A11yOverlay>
        <AnimatePresence>
          {selected && (
            <div
              className="a11y-layer fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setSelected(null)}
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
                aria-label={`Profil ${selected.name}`}
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-white rounded-2xl p-6 md:p-7 max-w-md w-full shadow-card-hover focus:outline-none max-h-[88vh] overflow-y-auto"
              >
                <button
                  onClick={() => setSelected(null)}
                  className="btn-icon absolute top-4 right-4"
                  aria-label="Tutup detail"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3.5 mb-5">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-line">
                    {selected.photo ? (
                      <Image src={selected.photo} alt={selected.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <span
                        className="absolute inset-0 flex items-center justify-center bg-brand-pine font-display text-sm font-extrabold text-brand-lime"
                        aria-hidden="true"
                      >
                        {initials(selected.name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display font-extrabold text-lg text-ink leading-tight">
                      {selected.name}
                    </h2>
                    <p className="text-muted text-xs mt-0.5">
                      Alumni SMAN 68 · Angkatan {selected.angkatan}
                    </p>
                    <span
                      className={cn(
                        "inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                        fieldStyle[selected.field]
                      )}
                    >
                      {selected.field}
                    </span>
                  </div>
                </div>

                <div className="bg-cream rounded-xl p-4 mb-5">
                  <div className="font-semibold text-ink text-sm">{selected.role}</div>
                  <div className="text-brand-green text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                    <Building2 size={12} aria-hidden="true" />
                    {selected.company}
                  </div>
                  <div className="text-muted text-xs mt-2 flex items-center gap-1.5">
                    <GraduationCap size={12} className="text-brand-green flex-shrink-0" aria-hidden="true" />
                    {selected.university}
                  </div>
                  <p className="text-muted text-xs leading-relaxed mt-3">{selected.bio}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={selected.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost flex-1"
                  >
                    LinkedIn
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </A11yOverlay>
    </section>
  );
}
