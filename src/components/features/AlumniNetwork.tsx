"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GraduationCap, X } from "lucide-react";
import { useModalA11y } from "@/lib/useModalA11y";
import { useContentResource } from "@/lib/use-content";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";
import PageHero from "@/components/ui/PageHero";
import AlumniCareerMap from "@/components/features/AlumniCareerMap";
import { CAREER_FIELDS } from "@/lib/alumni-career";

function LinkedinIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

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

type Alumni = {
  id: string;
  name: string;
  angkatan: string;
  jurusan: string;
  fakultas: string;
  kuliah: string;
  linkedin: string;
  photo: string;
};

const toDirectory = (a: AlumniRow): Alumni => ({
  id: a.id,
  name: a.name,
  angkatan: a.graduationYear == null ? "—" : String(a.graduationYear),
  jurusan: a.jobTitle,
  fakultas: a.company,
  kuliah: a.universityName ?? "",
  linkedin: a.linkedin,
  photo: a.photo,
});

/** Inisial nama untuk avatar cadangan saat alumni belum punya foto. */
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

export default function AlumniNetwork() {
  const { data: alumniRows, loading } = useContentResource<AlumniRow[]>("alumni", []);
  const alumni = useMemo(() => alumniRows.map(toDirectory), [alumniRows]);
  const alumniUniversities = useMemo(
    () => Array.from(new Set(alumni.map((a) => a.kuliah))).filter(Boolean),
    [alumni]
  );

  const [query, setQuery] = useState("");
  const [angkatan, setAngkatan] = useState("Semua");
  const [selected, setSelected] = useState<Alumni | null>(null);
  const modalRef = useModalA11y<HTMLDivElement>(!!selected, () => setSelected(null));

  const angkatanOptions = useMemo(
    () => [
      "Semua",
      ...Array.from(new Set(alumni.map((a) => a.angkatan).filter((a) => a !== "—"))).sort((a, b) =>
        b.localeCompare(a)
      ),
    ],
    [alumni]
  );

  const filtered = alumni.filter((a) => {
    const q = query.toLowerCase();
    const matchQ =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.jurusan.toLowerCase().includes(q) ||
      a.kuliah.toLowerCase().includes(q);
    const matchA = angkatan === "Semua" || a.angkatan === angkatan;
    return matchQ && matchA;
  });

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Jaringan Alumni <span className="text-brand-lime">SMAN 68</span>
          </>
        }
        lead="Alumni SMAN 68 Jakarta yang melanjutkan pendidikan di berbagai kampus ternama — terhubung lewat LinkedIn."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-40 rounded-full bg-white/20" />
              ))
            : [
                `${alumni.length} alumni terdata`,
                `${alumniUniversities.length} kampus`,
                `${CAREER_FIELDS.length} bidang karier`,
              ].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-xs font-semibold text-white/85"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" aria-hidden="true" />
                  {label}
            </span>
          ))}
        </div>
      </PageHero>

      <AlumniCareerMap />

      <div id="direktori" className="container-custom scroll-mt-24 py-12">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-ink">
              Direktori Kampus Alumni
            </h2>
            <p className="text-muted text-sm mt-1">
              Telusuri alumni berdasarkan nama, jurusan, kampus, atau angkatan.
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-4 w-52" />
          ) : (
            <p className="text-sm text-muted" aria-live="polite">
              Menampilkan <strong className="text-ink">{filtered.length}</strong> dari{" "}
              {alumni.length} alumni
            </p>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Cari nama, jurusan, atau kampus..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-4 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </div>
          <select
            value={angkatan}
            onChange={(e) => setAngkatan(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-green/30 sm:w-56"
          >
            {angkatanOptions.map((a) => (
              <option key={a} value={a}>
                {a === "Semua" ? "Semua Angkatan" : `Angkatan ${a}`}
              </option>
            ))}
          </select>
        </div>

        {loading && filtered.length === 0 && (
          <SkeletonGrid
            count={8}
            className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
            itemClassName="aspect-[4/3]"
          />
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((a, i) => (
              <motion.div
                layout
                key={a.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -3 }}
              >
                <button
                  onClick={() => setSelected(a)}
                  className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-brand-pine text-left"
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

                  <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                    Angkatan {a.angkatan}
                  </span>

                  <a
                    href={a.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-pine shadow-sm transition-colors hover:bg-white"
                    aria-label={`Profil LinkedIn ${a.name}`}
                  >
                    <LinkedinIcon size={14} />
                  </a>

                  <span className="absolute inset-x-0 bottom-0 p-4">
                    <span className="block font-display text-sm font-bold leading-snug text-white line-clamp-2 group-hover:underline decoration-brand-lime/60 decoration-2 underline-offset-4">
                      {a.name}
                    </span>
                    <span className="mt-1.5 block truncate text-[11px] text-white/80">
                      {a.jurusan}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-white/60">
                      {a.kuliah}
                    </span>
                  </span>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-white border border-line flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={24} className="text-muted" aria-hidden="true" />
            </div>
            <div className="font-semibold text-ink">Alumni tidak ditemukan</div>
            <div className="text-muted text-sm mt-1">Coba ubah filter atau kata kunci pencarian</div>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
              aria-label={selected.name}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl p-8 max-w-sm w-full shadow-card-hover focus:outline-none"
            >
              <button
                onClick={() => setSelected(null)}
                className="btn-icon absolute top-4 right-4"
                aria-label="Tutup detail"
              >
                <X size={16} />
              </button>

              <div className="relative w-16 h-16 rounded-2xl overflow-hidden mb-4 bg-line">
                {selected.photo ? (
                  <Image src={selected.photo} alt={selected.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <span
                    className="absolute inset-0 flex items-center justify-center bg-brand-pine font-display text-base font-extrabold text-brand-lime"
                    aria-hidden="true"
                  >
                    {initials(selected.name)}
                  </span>
                )}
              </div>
              <h2 className="font-display font-extrabold text-xl text-ink mb-1">{selected.name}</h2>
              <div className="text-muted text-sm mb-5">Alumni SMAN 68 · Angkatan {selected.angkatan}</div>

              <div className="space-y-3">
                <div className="bg-cream rounded-xl p-3.5">
                  <div className="text-xs text-muted mb-0.5">Jurusan</div>
                  <div className="font-semibold text-ink text-sm">{selected.jurusan}</div>
                </div>
                <div className="bg-cream rounded-xl p-3.5">
                  <div className="text-xs text-muted mb-0.5">Fakultas</div>
                  <div className="font-semibold text-ink text-sm">{selected.fakultas}</div>
                </div>
                <div className="bg-cream rounded-xl p-3.5">
                  <div className="text-xs text-muted mb-0.5">Kuliah di</div>
                  <div className="font-semibold text-ink text-sm">{selected.kuliah}</div>
                </div>
              </div>

              <a
                href={selected.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-lg mt-6 w-full"
              >
                <LinkedinIcon size={15} />
                Buka Profil LinkedIn
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
