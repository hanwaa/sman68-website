export const LEVEL_POINTS: Record<string, number> = {
  internasional: 100,
  nasional: 75,
  provinsi: 50,
  kota: 25,
  sekolah: 10,
};

export const LEVEL_LABELS: Record<string, string> = {
  internasional: "Internasional",
  nasional: "Nasional",
  provinsi: "Provinsi",
  kota: "Kota",
  sekolah: "Sekolah",
};

export const VERIFIED_STATUSES = ["published", "draft", "approved"] as const;

export function achievementPoints(level: string): number {
  return LEVEL_POINTS[String(level ?? "").toLowerCase()] ?? LEVEL_POINTS.sekolah;
}

export function levelLabel(level: string): string {
  const key = String(level ?? "").toLowerCase();
  return LEVEL_LABELS[key] ?? (level ? String(level) : "Sekolah");
}

/** Untuk siswa, prestasi yang sudah diverifikasi tetap dianggap sah (draft hanya menahan tampil publik). */
export function isVerified(status?: string): boolean {
  return status === "published" || status === "draft" || status === "approved";
}
