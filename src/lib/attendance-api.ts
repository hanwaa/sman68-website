export type AttendanceApiRecord = {
  studentId: string;
  name?: string;
  date: string;
  status: "Masuk" | "Izin" | "Sakit" | "Alpa" | null;
  selfieKey?: string | null;
  selfieUrl?: string | null;
  checkInTime?: string | null;
  recordedBy?: string | null;
};

/** Ambil data absensi dari Neon. Mengembalikan null bila API tidak tersedia. */
export async function apiFetchAttendance(params: {
  studentId?: string;
  date?: string;
  className?: string;
}): Promise<AttendanceApiRecord[] | null> {
  try {
    const qs = new URLSearchParams();
    if (params.studentId) qs.set("studentId", params.studentId);
    if (params.date) qs.set("date", params.date);
    if (params.className) qs.set("class", params.className);
    const res = await fetch(`/api/attendance?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const payload = (await res.json()) as { records?: AttendanceApiRecord[] };
    return payload.records ?? [];
  } catch {
    return null;
  }
}

/** Simpan/perbarui absensi di Neon. */
export async function apiPushAttendance(payload: {
  studentId: string;
  date: string;
  status?: "Masuk" | "Izin" | "Sakit" | "Alpa";
  selfieKey?: string;
  checkInTime?: string;
  recordedBy?: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const todayIsoDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};
