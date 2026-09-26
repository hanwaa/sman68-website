export type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: "Prestasi" | "Kegiatan" | "Pengumuman" | "Akademik" | "Alumni";
  author: string;
  cover: string;
  views: number;
  /** Label singkat untuk marquee, mis. "2 hari lalu" */
  dateLabel: string;
  publishedAt: string;
};

const dayAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

/**
 * Sumber tunggal berita SMAN 68.
 * Di-seed ke tabel `news` (Neon) lewat POST /api/admin/seed.
 */
export const newsArticles: NewsArticle[] = [
  {
    id: "1",
    slug: "tim-robotika-juara-1-nasional",
    title: "Tim Robotika SMAN 68 Raih Juara 1 Kompetisi Nasional di Bandung",
    excerpt:
      "Setelah berbulan-bulan persiapan intensif, tim Robotika SMAN 68 akhirnya meraih podium tertinggi dalam kompetisi robotika nasional yang diikuti 120 tim dari seluruh Indonesia.",
    content:
      "Tim Robotika SMA Negeri 68 Jakarta berhasil meraih juara pertama dalam Kompetisi Robotika Nasional yang diselenggarakan di Bandung. Kompetisi ini diikuti oleh 120 tim dari seluruh Indonesia.\n\nSetelah berbulan-bulan melakukan persiapan intensif, tim yang terdiri dari lima siswa kelas XI dan XII ini akhirnya bisa membuktikan diri di ajang bergengsi tersebut. Robot yang mereka rancang mampu menyelesaikan semua tantangan dengan sempurna.\n\nKami sangat bangga dengan pencapaian ini. Tim kami telah berlatih dengan sangat keras selama enam bulan terakhir, ujar pembina ekskul Robotika SMAN 68.\n\nKemenangan ini menjadi bukti nyata bahwa SMAN 68 Jakarta tidak hanya unggul di bidang akademik, tetapi juga dalam teknologi dan inovasi.",
    category: "Prestasi",
    author: "Admin SMAN 68",
    cover: "/assets/hero-1.png",
    views: 0,
    dateLabel: "2 hari lalu",
    publishedAt: dayAgo(2),
  },
  {
    id: "2",
    slug: "ppdb-2025-dibuka",
    title: "PPDB Resmi Dibuka — Simak Jadwal dan Persyaratannya",
    excerpt:
      "SMAN 68 Jakarta membuka pendaftaran peserta didik baru. Informasi lengkap mengenai jalur, kuota, dan jadwal seleksi tersedia di sini.",
    content:
      "SMAN 68 Jakarta resmi membuka Penerimaan Peserta Didik Baru (PPDB) untuk tahun ajaran 2025/2026. Pendaftaran akan dilaksanakan melalui portal resmi ppdb.jakarta.go.id.\n\nPPDB tahun ini membuka empat jalur: Zonasi (50%), Afirmasi (15%), Perpindahan Tugas (5%), dan Prestasi (30%). Setiap jalur memiliki persyaratan dan kuota tersendiri.\n\nJadwal PPDB:\n- Pendaftaran Zonasi: 3–7 Juni 2025\n- Pengumuman Zonasi: 12 Juni 2025\n- Pendaftaran Prestasi: 15–20 Juni 2025\n- Pengumuman Final: 25 Juni 2025\n- Daftar Ulang: 26–30 Juni 2025",
    category: "Pengumuman",
    author: "Tata Usaha",
    cover: "/assets/hero-2.png",
    views: 0,
    dateLabel: "5 hari lalu",
    publishedAt: dayAgo(5),
  },
  {
    id: "3",
    slug: "festival-seni-sman-68",
    title: "Festival Seni SMAN 68 — Pameran Karya Siswa yang Menakjubkan",
    excerpt:
      "Lebih dari 200 karya siswa dipamerkan dalam Festival Seni tahunan SMAN 68. Dari lukisan hingga instalasi digital, kreativitas generasi Z tercurah di sini.",
    content:
      "Lebih dari 200 karya siswa dipamerkan dalam Festival Seni tahunan SMAN 68. Dari lukisan hingga instalasi digital, kreativitas generasi Z tercurah di sini.\n\nFestival ini terbuka untuk umum dan berlangsung selama tiga hari berturut-turut di Aula SMAN 68 Jakarta.\n\nSelain pameran, pengunjung dapat mengikuti lokakarya seni rupa, musik, dan teater yang dibimbing langsung oleh para alumni dan praktisi.",
    category: "Kegiatan",
    author: "Ekskul Seni",
    cover: "/assets/foto-3.jpg",
    views: 0,
    dateLabel: "7 hari lalu",
    publishedAt: dayAgo(7),
  },
  {
    id: "4",
    slug: "top-10-sekolah-terbaik-jakarta",
    title: "SMAN 68 Masuk Top 10 Sekolah Terbaik Jakarta 2024",
    excerpt:
      "Berdasarkan penilaian Dinas Pendidikan DKI Jakarta, SMAN 68 berhasil masuk dalam daftar 10 sekolah terbaik di Jakarta untuk kategori SMA Negeri.",
    content:
      "Berdasarkan penilaian Dinas Pendidikan DKI Jakarta, SMAN 68 berhasil masuk dalam daftar 10 sekolah terbaik di Jakarta untuk kategori SMA Negeri.\n\nPenilaian mencakup capaian akademik, prestasi non-akademik, kualitas guru, serta keterlibatan orang tua dan komunitas.\n\nPencapaian ini menjadi penyemangat bagi seluruh warga sekolah untuk terus meningkatkan mutu layanan pendidikan.",
    category: "Prestasi",
    author: "Admin SMAN 68",
    cover: "/assets/hero-3.png",
    views: 0,
    dateLabel: "10 hari lalu",
    publishedAt: dayAgo(10),
  },
  {
    id: "5",
    slug: "workshop-ai-alumni-google",
    title: "Workshop AI & Machine Learning Bersama Alumni Google",
    excerpt:
      "Alumni SMAN 68 yang kini bekerja di Google mengadakan workshop eksklusif tentang kecerdasan buatan dan machine learning untuk siswa kelas XI dan XII.",
    content:
      "Alumni SMAN 68 yang kini bekerja di Google mengadakan workshop eksklusif tentang kecerdasan buatan dan machine learning untuk siswa kelas XI dan XII.\n\nDalam workshop ini siswa belajar dasar-dasar model bahasa, etika AI, dan peluang karier di bidang teknologi.\n\nKegiatan ini merupakan bagian dari program Alumni Mengajar yang rutin diadakan setiap semester.",
    category: "Kegiatan",
    author: "Ekskul IT",
    cover: "/assets/foto-4.jpg",
    views: 0,
    dateLabel: "14 hari lalu",
    publishedAt: dayAgo(14),
  },
  {
    id: "6",
    slug: "jadwal-uts-gasal-2024",
    title: "Jadwal Ujian Tengah Semester Gasal 2024/2025",
    excerpt:
      "Ujian Tengah Semester Gasal akan dilaksanakan mulai 10–15 November 2024. Berikut jadwal lengkap per mata pelajaran untuk seluruh kelas.",
    content:
      "Ujian Tengah Semester Gasal akan dilaksanakan mulai 10–15 November 2024. Berikut jadwal lengkap per mata pelajaran untuk seluruh kelas.\n\nSiswa diharapkan mempersiapkan diri dan membawa perlengkapan ujian yang diperlukan. Jadwal lengkap dapat diunduh melalui wali kelas masing-masing.",
    category: "Akademik",
    author: "Tata Usaha",
    cover: "/assets/hero-4.jpeg",
    views: 0,
    dateLabel: "3 hari lalu",
    publishedAt: dayAgo(3),
  },
];
