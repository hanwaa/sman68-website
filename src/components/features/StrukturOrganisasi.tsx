"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  ChevronDown,
  GraduationCap,
  Landmark,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildOrgSections,
  subjectGroupsOf,
  type OrgMember,
  type OrgUnit,
  type OrgUnitWithMembers,
} from "@/lib/struktur-organisasi";
import { useContentResource } from "@/lib/use-content";
import { Skeleton } from "@/components/ui/Skeleton";
import PageHero from "@/components/ui/PageHero";

type OrgPayload = { units: OrgUnit[]; members: OrgMember[] };

type OrgProps = { initialOrg?: OrgPayload };

const KIND_ICONS: Record<string, LucideIcon> = {
  sekolah: Landmark,
  osis: Users,
  mpk: Users,
};

function initials(name: string) {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function MemberCard({ member }: { member: OrgMember }) {
  return (
    <li className="flex items-start gap-3.5 rounded-xl border border-line bg-white p-3.5">
      <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-brand-mist">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.name}
            fill
            sizes="48px"
            className="object-cover object-top"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center font-display text-sm font-extrabold text-brand-leaf"
            aria-hidden="true"
          >
            {initials(member.name)}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-bold leading-snug text-ink">
          {member.name}
        </span>
        <span className="mt-0.5 block text-xs font-medium text-brand-green">
          {member.position}
        </span>
        {member.alumni && (
          <span className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
            <GraduationCap
              size={12}
              className="mt-0.5 flex-shrink-0 text-brand-leaf"
              aria-hidden="true"
            />
            {member.alumni}
          </span>
        )}
      </span>
    </li>
  );
}

/** Satu unit dalam pohon: kepsek → wakil → guru. */
function UnitNode({
  unit,
  depth,
  defaultOpen,
}: {
  unit: OrgUnitWithMembers;
  depth: number;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || depth === 0);
  const isGuru = unit.id === "guru";
  const groups = useMemo(
    () => (isGuru ? subjectGroupsOf(unit.members) : []),
    [isGuru, unit.members]
  );

  return (
    <li
      className={cn(
        "relative",
        depth > 0 && "ml-4 border-l-2 border-line pl-4 sm:ml-6 sm:pl-6"
      )}
    >
      <span
        className="absolute -left-[5px] top-6 h-2 w-2 rounded-full bg-brand-leaf"
        aria-hidden="true"
      />

      <div
        className={cn(
          "rounded-xl border bg-white transition-colors",
          depth === 0 ? "border-brand-pine/20 shadow-card" : "border-line"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full items-center gap-3 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
        >
          <span
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
              depth === 0
                ? "bg-brand-pine text-brand-lime"
                : "bg-brand-mist text-brand-leaf"
            )}
          >
            {depth === 0 ? (
              <Landmark size={16} aria-hidden="true" />
            ) : (
              <UserCog size={16} aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm font-extrabold text-ink">
              {unit.name}
            </span>
            <span className="mt-0.5 block text-xs text-muted">
              {isGuru
                ? `${unit.members.length} guru & tenaga kependidikan`
                : unit.description ||
                  (unit.members.length > 0
                    ? `${unit.members.length} orang`
                    : "Unit organisasi")}
            </span>
          </span>
          {unit.members.length > 0 && (
            <span className="flex flex-shrink-0 items-center gap-1.5 text-[11px] text-muted">
              {unit.members.length}
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={cn(
                  "transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="border-t border-line p-4">
                {isGuru ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {groups.map((group) => (
                      <div key={group.subject}>
                        <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-leaf">
                          <span className="h-px flex-1 bg-line" aria-hidden="true" />
                          {group.subject}
                        </h4>
                        <ul className="grid gap-2">
                          {group.members.map((member) => (
                            <MemberCard key={member.id} member={member} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {unit.members.map((member) => (
                      <MemberCard key={member.id} member={member} />
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

export default function StrukturOrganisasi({ initialOrg }: OrgProps) {
  const { data, loading } = useContentResource<OrgPayload>(
    "struktur",
    { units: [], members: [] },
    initialOrg
  );

  const sections = useMemo(() => {
    if (!data?.units?.length || !data?.members?.length) return [];
    try {
      return buildOrgSections(data.units, data.members);
    } catch {
      return [];
    }
  }, [data]);

  const totalPeople = useMemo(
    () => sections.reduce((sum, section) => sum + section.units.reduce((n, u) => n + u.members.length, 0), 0),
    [sections]
  );

  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Struktur <span className="text-brand-lime">Organisasi</span>
          </>
        }
        lead="Kepemimpinan sekolah, guru dan tenaga kependidikan, serta pengurus OSIS dan MPK SMAN 68 Jakarta."
      >
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          {[
            { value: "5", label: "Unit Kerja" },
            { value: loading ? "—" : String(totalPeople), label: "Nama Tercantum" },
            { value: "3", label: "Sekolah, OSIS, MPK" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display font-extrabold text-2xl text-brand-lime">
                {stat.value}
              </div>
              <div className="text-xs text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </PageHero>

      <div className="container-custom py-10">
        <p className="mb-8 max-w-3xl rounded-xl border border-line bg-white p-4 text-xs leading-relaxed text-muted">
          Halaman ini hanya memuat data yang aman dipublikasikan: nama, jabatan,
          mata pelajaran, dan riwayat pendidikan. Data internal seperti NIP,
          tanggal lahir, dan kontak pribadi tidak ditampilkan.
        </p>

        {loading && sections.length === 0 ? (
          <div className="space-y-4" aria-busy="true">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : sections.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-muted">
              Data struktur organisasi belum tersedia.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map((section) => {
              const Icon = KIND_ICONS[section.kind] ?? Building2;
              return (
                <section key={section.kind} aria-labelledby={`bagian-${section.kind}`}>
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <div>
                      <h2
                        id={`bagian-${section.kind}`}
                        className="font-display text-xl font-extrabold text-ink"
                      >
                        {section.units[0]?.name ?? section.label}
                      </h2>
                      <p className="mt-0.5 text-sm text-muted">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  {section.kind === "sekolah" ? (
                    <ul className="space-y-3">
                      {section.units.map((unit) => (
                        <UnitNode
                          key={unit.id}
                          unit={unit}
                          depth={unit.parentId ? 1 : 0}
                          defaultOpen={unit.id === "kepsek"}
                        />
                      ))}
                    </ul>
                  ) : (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {section.units.flatMap((unit) =>
                        unit.members.map((member) => (
                          <MemberCard key={member.id} member={member} />
                        ))
                      )}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
