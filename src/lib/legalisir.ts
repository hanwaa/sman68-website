/** Helper legalisir ijazah, dipakai dashboard siswa & API. */

export function isGrade12(className?: string | null): boolean {
  if (!className) return false;
  const v = className.trim().toUpperCase().replace(/[\s._-]+/g, " ");
  return (
    v.startsWith("XII") ||
    v.startsWith("12 ") ||
    v === "12" ||
    v.startsWith("KELAS 12") ||
    v.startsWith("KELAS XII")
  );
}

export type LegalisirStatus = "pending" | "approved" | "rejected" | "done";

export type LegalisirRequest = {
  id: string;
  studentName: string;
  className: string | null;
  sheets: number;
  purpose: string;
  status: LegalisirStatus;
  note: string | null;
  createdAt: string;
};
