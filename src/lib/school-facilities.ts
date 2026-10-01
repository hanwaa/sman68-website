import "server-only";

import { dbConfigured, getDb } from "@/lib/db";
import { filterPublicRooms } from "@/lib/fasilitas-publik";

export type Facility = {
  id: string;
  name: string;
  category: string | null;
  floor: string | null;
  building: string | null;
  capacity: number | null;
  description: string | null;
};

const FACILITY_KEYWORDS = [
  "fasilitas",
  "lantai",
  "ruang",
  "gedung",
  "lab",
  "laboratorium",
  "kantin",
  "aula",
  "gym",
  "kebugaran",
  "perpustakaan",
  "toilet",
  "musala",
  "parkir",
  "halaman",
  "outdoor",
  "lapangan",
  "ruangan",
];

let cache: { at: number; items: Facility[] } | null = null;
const CACHE_TTL = 5 * 60_000;

export function isFacilityQuestion(message: string): boolean {
  const text = message.toLowerCase();
  return FACILITY_KEYWORDS.some((keyword) => text.includes(keyword));
}

function detectFloor(message: string): string | null {
  const text = message.toLowerCase();
  const named: Record<string, string> = {
    basement: "Basement",
    "lantai bawah": "Basement",
    "lantai 1": "Lantai 1",
    "lantai satu": "Lantai 1",
    "lantai 2": "Lantai 2",
    "lantai dua": "Lantai 2",
    "lantai 3": "Lantai 3",
    "lantai tiga": "Lantai 3",
    "lantai 4": "Lantai 4",
    "lantai empat": "Lantai 4",
    "lantai 5": "Lantai 5",
    "lantai lima": "Lantai 5",
    "lantai 6": "Lantai 6",
    "lantai enam": "Lantai 6",
  };
  for (const [needle, floor] of Object.entries(named)) {
    if (text.includes(needle)) return floor;
  }
  const angka = text.match(/lantai\s*(\d+)/);
  if (angka) return `Lantai ${angka[1]}`;
  return null;
}

/**
 * Ruangan yang boleh disebut ke pengunjung lewat chatbot.
 * Ruang administrasi sekolah (ruang guru, kepala sekolah, tata usaha, dst.)
 * disaring di sini agar tidak bocor lewat jawaban chat.
 */
export async function getFacilities(): Promise<Facility[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.items;
  if (!dbConfigured()) return [];

  try {
    const rows = await getDb()`
      select id, name, category, floor, building, capacity, description
      from facilities
      order by sort asc
    `;
    const items: Facility[] = filterPublicRooms(
      rows.map((row) => ({
        id: String(row.id ?? ""),
        name: String(row.name ?? ""),
        category: row.category == null ? null : String(row.category),
        floor: row.floor == null ? null : String(row.floor),
        building: row.building == null ? null : String(row.building),
        capacity: row.capacity == null ? null : Number(row.capacity),
        description: row.description == null ? null : String(row.description),
      }))
    );
    cache = { at: Date.now(), items };
    return items;
  } catch (error) {
    console.warn("[facilities] gagal memuat:", error instanceof Error ? error.message : error);
    return [];
  }
}
/**
 * Kata kunci yang menunjuk ke ruang tertentu (dicari dari nama & deskripsi ruang).
 * Hanya ruang consumption publik, ruang administrasi disaring oleh
 * `getFacilities` dan karena itu tidak perlu dicantumkan di sini.
 */
const SUBJECT_HINTS: { needle: string; label: string }[] = [
  { needle: "perpustakaan", label: "perpustakaan" },
  { needle: "lab komputer", label: "Lab Komputer" },
  { needle: "lab ips", label: "Lab IPS" },
  { needle: "lab biologi", label: "Lab Biologi" },
  { needle: "lab", label: "laboratorium" },
  { needle: "laboratorium", label: "laboratorium" },
  { needle: "kantin", label: "Kantin Sekolah" },
  { needle: "kantin sekolah", label: "Kantin Sekolah" },
  { needle: "aula", label: "Aula Serbaguna" },
  { needle: "gym", label: "Ruang Gym & Kebugaran" },
  { needle: "kebugaran", label: "Ruang Gym & Kebugaran" },
  { needle: "musala", label: "ruang ibadah" },
  { needle: "masjid", label: "Masjid Darul Ulum" },
  { needle: "agama", label: "ruang agama" },
  { needle: "lapangan", label: "Lapangan & Halaman" },
  { needle: "halaman", label: "Lapangan & Halaman" },
  { needle: "climbing", label: "Climbing Wall" },
  { needle: "gudang olahraga", label: "Gudang Olahraga" },
  { needle: "koperasi", label: "Koperasi Sekolah" },
  { needle: "uks", label: "Ruang UKS" },
  { needle: "bk", label: "Ruang BK" },
  { needle: "audio visual", label: "Ruang Audio Visual" },
  { needle: "galeri", label: "Galeri Prestasi" },
];

function detectSubject(message: string, items: Facility[]) {
  const text = message.toLowerCase();
  for (const hint of SUBJECT_HINTS) {
    if (!text.includes(hint.needle)) continue;
    const matches = items.filter((item) => {
      const haystack = `${item.name} ${item.description ?? ""} ${item.category ?? ""}`.toLowerCase();
      return haystack.includes(hint.needle);
    });
    if (matches.length > 0) return matches;
  }
  return null;
}

/** Jawab pertanyaan fasilitas langsung dari data sekolah (bukan dari web). */
export async function buildFacilityAnswer(message: string): Promise<string | null> {
  if (!isFacilityQuestion(message)) return null;
  const items = await getFacilities();
  if (items.length === 0) return null;

  const floor = detectFloor(message);
  const floorItems = floor ? items.filter((item) => item.floor === floor) : items;
  const subject = detectSubject(message, floorItems);
  const scoped = subject ?? floorItems;

  if (scoped.length === 0) {
    const available = Array.from(new Set(items.map((item) => item.floor).filter(Boolean)));
    return floor
      ? `Belum ada data ruangan untuk ${floor} di situs kami. Lantai yang tercatat: ${available.join(", ")}.`
      : null;
  }

  const lines = scoped.map((item) => {
    const detail = item.description ? `, ${item.description}` : "";
    const capacity = item.capacity ? ` (kapasitas ${item.capacity} orang)` : "";
    return `• ${item.name}${capacity}${detail}`;
  });

  const perFloor = Array.from(new Set(scoped.map((item) => item.floor).filter(Boolean))) as string[];

  if (subject) {
    return [
      `Di SMAN 68 Jakarta ada ${scoped.length} ruangan cocok, di ${perFloor.join(", ") || "tidak tercatat"}:`,
      ...lines,
    ].join("\n");
  }

  if (floor) {
    return [`${floor} di SMAN 68 Jakarta punya ${scoped.length} ruang:`, ...lines].join("\n");
  }

  const ringkasan = Array.from(
    new Set(scoped.map((item) => item.floor).filter(Boolean))
  ).map((group) => {
    const nama = scoped.filter((item) => item.floor === group).map((item) => item.name);
    const shown = nama.slice(0, 5).join(", ");
    const rest = nama.length - 5;
    return `• ${group} (${nama.length}): ${shown}${rest > 0 ? `, dan ${rest} lainnya` : ""}`;
  });

  return [
    `SMAN 68 Jakarta punya ${items.length} ruang/ruangan di ${ringkasan.length} area. Tanya per lantai untuk detailnya:`,
    ...ringkasan,
  ].join("\n");
}
