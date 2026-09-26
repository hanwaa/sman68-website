// Bucket Cloudflare R2: sma68-website
export const R2_BASE = "https://pub-8156d70781324453bda28e90108800f1.r2.dev";

export type AbsensiStatus = "Masuk" | "Izin" | "Sakit" | "Alpa";

export type AbsensiRecord = {
  studentId: string;
  name: string;
  kelas: string;
  time: string;
  iso: string;
  selfieUrl: string;
  selfieLocal?: string;
  status?: AbsensiStatus;
};

const STORAGE_KEY = "sman68_absensi_records";

export function absensiSelfieUrl(studentId: string): string {
  return `${R2_BASE}/absensi/${studentId}.jpg`;
}

export function getAbsensiRecords(): AbsensiRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AbsensiRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveAbsensiRecord(record: AbsensiRecord): AbsensiRecord[] {
  const records = getAbsensiRecords();
  const index = records.findIndex((r) => r.studentId === record.studentId);

  if (index >= 0) {
    // Perbarui data presensi terbaru, tapi status pilihan wali kelas dipertahankan
    records[index] = {
      ...records[index],
      ...record,
      status: records[index].status ?? record.status,
    };
  } else {
    records.unshift(record);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* kuota localStorage penuh — abaikan untuk demo */
  }
  return records;
}
