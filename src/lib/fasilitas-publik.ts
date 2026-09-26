/**
 * Aturan ruangan yang boleh tampil di Channel publik.
 *
 * Peta fasilitas di /tentang/fasilitas dan jawaban chatbot memakai daftar ini,
 * supaya keduanya tidak pernah membocorkan ruang administrasi sekolah. Ruangan
 * seperti ruang guru, ruang kepala sekolah, dan tata usaha sengaja disembunyikan:
 * informasinya tidak relevan bagi calon siswa maupun pengunjung umum.
 */
export const INTERNAL_ROOM_IDS: ReadonlySet<string> = new Set([
  "ruang-guru",
  "kepala-sekolah",
  "wakil-kepala",
  "tata-usaha",
  "piket",
  "pos-satpam",
]);

export function isPublicRoom(id: string): boolean {
  return !INTERNAL_ROOM_IDS.has(id);
}

export function filterPublicRooms<T extends { id: string }>(rooms: T[]): T[] {
  return rooms.filter((room) => isPublicRoom(room.id));
}
