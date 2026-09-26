import { schoolData } from "@/lib/school-data";

const kontak = schoolData.kontak;

export const GREETING =
  "Halo! Saya asisten virtual SMAN 68 Jakarta. Saya bisa bantu soal PPDB, biaya dan beasiswa, fasilitas dan ruang kelas, jam pelajaran, ekstrakurikuler, prestasi, berita, sampai kontak sekolah. Silakan tanya.";

export const DEFAULT_CHIPS = [
  "Info PPDB",
  "Biaya sekolah",
  "Fasilitas",
  "Ekstrakurikuler",
  "Prestasi terbaru",
  "Kontak sekolah",
];

export const FALLBACK_ANSWER = `Maaf, jawaban untuk itu belum saya temukan. Saya bisa membantu soal PPDB, biaya dan beasiswa, fasilitas dan ruang kelas, jam pelajaran, ekstrakurikuler, prestasi, berita, serta kelas digital. Untuk pertanyaan lain, hubungi Tata Usaha di ${kontak.telepon} atau ${kontak.email}.`;

export const ERROR_ANSWER = `Maaf, koneksi ke server sedang terputus. Coba beberapa saat lagi, atau hubungi Tata Usaha di ${kontak.telepon}.`;
