/**
 * Struktur organisasi SMAN 68: kepala sekolah & guru, OSIS, dan MPK.
 *
 * Hanya data yang aman dipublikasikan yang disimpan di sini — nama, jabatan,
 * mata pelajaran, dan riwayat pendidikan. Data pribadi/internal (NIP, tanggal
 * lahir, kontak, nilai) tidak pernah masuk ke struktur organisasi.
 *
 * Di-seed ke tabel `org_units` + `org_members` (Neon) lewat CMS admin.
 */
export type OrgUnitKind = "sekolah" | "osis" | "mpk";

export type OrgUnit = {
  id: string;
  name: string;
  kind: OrgUnitKind;
  parentId: string | null;
  /** Kelompok mata pelajaran, hanya untuk unit guru. */
  subject?: string;
  description?: string;
  sort: number;
};

export type OrgMember = {
  id: string;
  unitId: string;
  name: string;
  position: string;
  /** Riwayat pendidikan / asal lulusan. */
  alumni: string | null;
  photo: string | null;
  sort: number;
};

export type OrgUnitWithMembers = OrgUnit & { members: OrgMember[] };

export type OrgSection = {
  kind: OrgUnitKind;
  label: string;
  description: string;
  units: OrgUnitWithMembers[];
};

export const ORG_UNIT_KINDS: OrgUnitKind[] = ["sekolah", "osis", "mpk"];

export const ORG_KIND_META: Record<
  OrgUnitKind,
  { label: string; description: string }
> = {
  sekolah: {
    label: "Kepemimpinan & Guru",
    description:
      "Rangkaian dari kepala sekolah, wakil kepala sekolah, hingga guru menurut mata pelajaran.",
  },
  osis: {
    label: "OSIS",
    description:
      "Organisasi Siswa Intra Sekolah; ketua dan pengurus dipilih setiap tahun ajaran.",
  },
  mpk: {
    label: "MPK",
    description: "Wadah musyawarah siswa di tingkat sekolah.",
  },
};

/** Pohon unit: kepsek → wakil → guru, plus OSIS dan MPK. */
export const orgUnits: OrgUnit[] = [
  { id: "kepsek", name: "Kepala Sekolah", kind: "sekolah", parentId: null, sort: 1 },
  {
    id: "wakil-kepsek",
    name: "Wakil Kepala Sekolah",
    kind: "sekolah",
    parentId: "kepsek",
    sort: 2,
  },
  {
    id: "guru",
    name: "Guru & Tenaga Kependidikan",
    kind: "sekolah",
    parentId: "wakil-kepsek",
    description: "Dikelompokkan menurut bidang mata pelajaran yang diampu.",
    sort: 3,
  },
  {
    id: "osis",
    name: "OSIS",
    kind: "osis",
    parentId: null,
    description: "Dipilih kembali pada awal tahun ajaran baru.",
    sort: 4,
  },
  {
    id: "mpk",
    name: "MPK",
    kind: "mpk",
    parentId: null,
    description: "Menjadi saudara kerohanian bagi seluruh siswa SMA.",
    sort: 5,
  },
];

export const orgMembers: OrgMember[] = [
  {
    id: "kepsek-1",
    unitId: "kepsek",
    name: "Drs. Ahmad Fauzi, M.Pd.",
    position: "Kepala Sekolah",
    alumni: "S3 Pendidikan Teknologi — Universitas Negeri Jakarta (2012)",
    photo: null,
    sort: 1,
  },
  {
    id: "wakil-1",
    unitId: "wakil-kepsek",
    name: "Dra. Ratna Dewi, M.Hum.",
    position: "Wakil Kepala Sekolah — Bidang Kurikulum",
    alumni: "S2 Ilmu Humaniora — Universitas Indonesia (2009)",
    photo: null,
    sort: 1,
  },
  {
    id: "wakil-2",
    unitId: "wakil-kepsek",
    name: "Budi Santoso, S.Pd.",
    position: "Wakil Kepala Sekolah — Bidang Kesiswaan",
    alumni: "S2 Teknologi Pendidikan — Universitas Teknologi Indonesia (2010)",
    photo: null,
    sort: 2,
  },
  {
    id: "wakil-3",
    unitId: "wakil-kepsek",
    name: "Nurul Hidayah, S.Pd., M.Si.",
    position: "Wakil Kepala Sekolah — Bidang Sarana Prasarana",
    alumni: "S2 Ilmu Kimia — Institut Teknologi Bandung (2011)",
    photo: null,
    sort: 3,
  },
  {
    id: "guru-1",
    unitId: "guru",
    name: "Drs. Hendra Gunawan, M.Pd.",
    position: "Guru Matematika",
    alumni: "S2 Pendidikan Matematika — Universitas Pendidikan Indonesia (2007)",
    photo: null,
    sort: 1,
  },
  {
    id: "guru-2",
    unitId: "guru",
    name: "Siti Rahayu, S.Pd., M.Si.",
    position: "Guru Fisika",
    alumni: "S2 Pendidikan Fisika — Universitas Gadjah Mada (2008)",
    photo: null,
    sort: 2,
  },
  {
    id: "guru-3",
    unitId: "guru",
    name: "Rina Wulandari, S.Si.",
    position: "Guru Kimia & Pembina KIR",
    alumni: "S2 Teknik Kimia — Institut Teknologi Bandung (2006)",
    photo: null,
    sort: 3,
  },
  {
    id: "guru-4",
    unitId: "guru",
    name: "Dr. Wahyu Santoso",
    position: "Guru Biologi & Koordinator Olimpiade",
    alumni: "S3 Biologi — Universitas Gadjah Mada (2009)",
    photo: null,
    sort: 4,
  },
  {
    id: "guru-5",
    unitId: "guru",
    name: "Eko Prasetyo, S.T.",
    position: "Guru Informatika & Pembina Robotika",
    alumni: "S2 Teknik Informatika — Universitas Bina Nusantara (2010)",
    photo: null,
    sort: 5,
  },
  {
    id: "guru-6",
    unitId: "guru",
    name: "Dewi Astuti, S.Pd.",
    position: "Guru Bahasa Indonesia",
    alumni: "S2 Pendidikan Bahasa Indonesia — Universitas Pendidikan Indonesia (2008)",
    photo: null,
    sort: 6,
  },
  {
    id: "guru-7",
    unitId: "guru",
    name: "Rina Kusuma, S.Pd.",
    position: "Guru Bahasa Inggris & Pembina Debat",
    alumni: "S2 Linguistik Terapan — Universitas Indonesia (2011)",
    photo: null,
    sort: 7,
  },
  {
    id: "guru-8",
    unitId: "guru",
    name: "Maya Indah, S.Psi.",
    position: "Guru Sejarah & Pembina Histoloka",
    alumni: "S2 Ilmu Sejarah — Universitas Indonesia (2010)",
    photo: null,
    sort: 8,
  },
  {
    id: "guru-9",
    unitId: "guru",
    name: "Fajar Ramadhan, S.Pd.",
    position: "Guru Ekonomi",
    alumni: "S2 Ilmu Ekonomi — Universitas Trisakti (2009)",
    photo: null,
    sort: 9,
  },
  {
    id: "guru-10",
    unitId: "guru",
    name: "Dewi Anggraini, S.Psi.",
    position: "Guru Bimbingan Konseling",
    alumni: "S2 Psikologi Pendidikan — Universitas Negeri Jakarta (2011)",
    photo: null,
    sort: 10,
  },
  {
    id: "guru-11",
    unitId: "guru",
    name: "Ahmad Ridwan, S.Or.",
    position: "Guru Pendidikan Jasmani & Pembina Paskibra",
    alumni: "S1 Pendidikan Jasmani — Universitas Negeri Jakarta (2007)",
    photo: null,
    sort: 11,
  },
  {
    id: "osis-1",
    unitId: "osis",
    name: "Rafi Ahmad",
    position: "Ketua OSIS",
    alumni: null,
    photo: null,
    sort: 1,
  },
  {
    id: "osis-2",
    unitId: "osis",
    name: "Putri Sari",
    position: "Wakil Ketua OSIS",
    alumni: null,
    photo: null,
    sort: 2,
  },
  {
    id: "osis-3",
    unitId: "osis",
    name: "Bagas Nugroho",
    position: "Sekretaris OSIS",
    alumni: null,
    photo: null,
    sort: 3,
  },
  {
    id: "osis-4",
    unitId: "osis",
    name: "Anisa Rahma",
    position: "Bendahara OSIS",
    alumni: null,
    photo: null,
    sort: 4,
  },
  {
    id: "mpk-1",
    unitId: "mpk",
    name: "Kevin Pratama",
    position: "Ketua MPK",
    alumni: null,
    photo: null,
    sort: 1,
  },
  {
    id: "mpk-2",
    unitId: "mpk",
    name: "Nadia Kusuma",
    position: "Wakil Ketua MPK",
    alumni: null,
    photo: null,
    sort: 2,
  },
  {
    id: "mpk-3",
    unitId: "mpk",
    name: "Dito Prasetyo",
    position: "Sekretaris MPK",
    alumni: null,
    photo: null,
    sort: 3,
  },
  {
    id: "mpk-4",
    unitId: "mpk",
    name: "Sari Dewi",
    position: "Bendahara MPK",
    alumni: null,
    photo: null,
    sort: 4,
  },
];

/** Kelompokkan anggota ke unit-nya, urut sesuai `sort`. */
export function attachMembersToUnits(
  units: OrgUnit[],
  members: OrgMember[]
): OrgUnitWithMembers[] {
  const byUnit = new Map<string, OrgMember[]>();
  for (const member of members) {
    const list = byUnit.get(member.unitId) ?? [];
    list.push(member);
    byUnit.set(member.unitId, list);
  }
  for (const list of byUnit.values()) list.sort((a, b) => a.sort - b.sort);

  return [...units]
    .sort((a, b) => a.sort - b.sort)
    .map((unit) => ({ ...unit, members: byUnit.get(unit.id) ?? [] }));
}

/** Pisahkan unit jadi tiga bagian halaman: sekolah, OSIS, MPK. */
export function buildOrgSections(
  units: OrgUnit[],
  members: OrgMember[]
): OrgSection[] {
  const withMembers = attachMembersToUnits(units, members);
  return ORG_UNIT_KINDS.map((kind) => {
    const kindUnits = withMembers.filter((unit) => unit.kind === kind);
    return {
      kind,
      label: ORG_KIND_META[kind].label,
      description:
        kind === "sekolah"
          ? ORG_KIND_META[kind].description
          : (kindUnits[0]?.description ?? ORG_KIND_META[kind].description),
      units: kindUnits,
    };
  });
}

/**
 * Guru dikelompokkan menurut mata pelajaran, diambil dari jabatannya
 * ("Guru Matematika & Pembina KIR" -> "Matematika").
 */
export function subjectGroupsOf(
  members: OrgMember[]
): { subject: string; members: OrgMember[] }[] {
  const groups = new Map<string, OrgMember[]>();
  for (const member of members) {
    const match = member.position.match(/^Guru\s+(.+?)(?:\s*&\s*.*)?$/);
    const subject = (match?.[1] ?? "Lainnya").trim();
    const list = groups.get(subject) ?? [];
    list.push(member);
    groups.set(subject, list);
  }
  return Array.from(groups, ([subject, list]) => ({ subject, members: list }));
}
