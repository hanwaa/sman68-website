import { schoolData } from "@/lib/school-data";

export type AchievementContent = {
  id: string; title: string; description: string;
  level: "internasional" | "nasional" | "provinsi" | "kota" | "sekolah";
  category: string;
  awardType: "juara1" | "juara2" | "juara3" | "semifinal" | "participasi" | "penghargaan";
  year: number;
  cover: string;
  participants?: string[];
  studentName?: string | null;
  /** Ekskul pemilik prestasi ini. Kosong = prestasi tingkat sekolah. */
  ekskulId?: string | null;
  createdAt?: string | null;
  /** Slug berita terkait, diisi dari tabel `news`. */
  newsSlug?: string | null;
  newsTitle?: string | null;
};

export const achievements: AchievementContent[] = [
  { id: "1", title: "Juara 1 Olimpiade Matematika Nasional", description: "Tim SMAN 68 meraih medali emas di Olimpiade Matematika tingkat nasional yang diikuti oleh 500+ peserta dari seluruh Indonesia.", level: "nasional", category: "akademik", awardType: "juara1", year: 2024, cover: "/assets/sekolah/sekolah-07-presentasi-kelas.jpg", participants: ["Rafi Ahmad", "Putri Sari"], ekskulId: "kir" },
  { id: "2", title: "Best Innovation — International Science Fair", description: "Proyek inovasi energi terbarukan karya siswa kelas XII meraih penghargaan tertinggi di kompetisi sains internasional.", level: "internasional", category: "sains", awardType: "penghargaan", year: 2024, cover: "/assets/sekolah/sekolah-08-seminar-karya-ilmiah.jpg", participants: ["Kevin Pratama", "Nadia Kusuma"], ekskulId: "ivratix" },
  { id: "3", title: "Juara 1 FLS2N — Paduan Suara Provinsi", description: "Paduan Suara SMAN 68 tampil memukau dan meraih juara 1 di Festival Lomba Seni Siswa Nasional tingkat provinsi.", level: "provinsi", category: "seni", awardType: "juara1", year: 2024, cover: "/assets/sekolah/sekolah-15-fls2n.jpg", ekskulId: "mbrass" },
  { id: "4", title: "Medali Emas Olimpiade Fisika Kota", description: "Siswa SMAN 68 meraih medali emas di kompetisi fisika tingkat kota Jakarta.", level: "kota", category: "akademik", awardType: "juara1", year: 2024, cover: "/assets/sekolah/sekolah-09-pembelajaran.jpg", participants: ["Bima Putra"], ekskulId: "tosla" },
  { id: "5", title: "Juara Umum O2SN Jakarta Pusat", description: "Atlet SMAN 68 dominasi Olimpiade Olahraga Siswa Nasional tingkat kota Jakarta.", level: "kota", category: "olahraga", awardType: "juara1", year: 2024, cover: "/assets/sekolah/sekolah-06-apel.jpg", ekskulId: "tosla" },
  { id: "6", title: "Juara 2 Debat Bahasa Inggris Nasional", description: "Tim Debat SMAN 68 raih posisi runner-up di kompetisi debat bahasa Inggris tingkat nasional.", level: "nasional", category: "akademik", awardType: "juara2", year: 2023, cover: "/assets/foto-2.webp", participants: ["Anisa Rahma", "Dito Prasetyo"], ekskulId: "kir" },
  { id: "7", title: "Medali Perunggu Olimpiade Kimia Nasional", description: "Prestasi membanggakan di Olimpiade Kimia Nasional — membuktikan kekuatan akademik SMAN 68.", level: "nasional", category: "sains", awardType: "juara3", year: 2023, cover: "/assets/foto-1.jpg", participants: ["Sari Dewi"], ekskulId: "kir" },
  { id: "8", title: "Juara 1 O2SN Basket Putra Kota", description: "Tim basket putra SMAN 68 tak terkalahkan di O2SN tingkat kota Jakarta.", level: "kota", category: "olahraga", awardType: "juara1", year: 2023, cover: "/assets/foto-4.jpg", ekskulId: "sight-basketball" },
  { id: "9", title: "Penghargaan Sekolah Sehat Nasional", description: "SMAN 68 mendapatkan penghargaan Sekolah Sehat dari Kementerian Kesehatan RI.", level: "nasional", category: "sosial", awardType: "penghargaan", year: 2023, cover: "/assets/sekolah/sekolah-13-pentas-siswa.jpg", ekskulId: "pmr" },
  { id: "10", title: "Juara 1 Karya Ilmiah Remaja Provinsi", description: "Penelitian inovatif siswa SMAN 68 mengungguli 200+ peserta se-DKI Jakarta.", level: "provinsi", category: "akademik", awardType: "juara1", year: 2022, cover: "/assets/hero-1.png", participants: ["Rizky Maulana", "Fitri Handayani"], ekskulId: "kir" },
  { id: "11", title: "Semifinal ASEAN Robotics Championship", description: "Tim Robotika SMAN 68 berhasil menembus babak semifinal kompetisi robotika tingkat ASEAN.", level: "internasional", category: "teknologi", awardType: "semifinal", year: 2022, cover: "/assets/hero-2.png", ekskulId: "ivratix" },
  { id: "12", title: "Juara 2 FLS2N Seni Tari", description: "Penari SMAN 68 menampilkan karya tari kontemporer yang memukau dan meraih juara 2.", level: "provinsi", category: "seni", awardType: "juara2", year: 2022, cover: "/assets/hero-4.jpeg", ekskulId: "mbrass" },
  { id: "13", title: "Juara 3 OSN Informatika Nasional", description: "Siswa kelas XI SMAN 68 meraih perunggu pada Olimpiade Sains Nasional bidang Informatika.", level: "nasional", category: "teknologi", awardType: "juara3", year: 2023, cover: "/assets/foto-2.webp", ekskulId: "nest-esport" },
  { id: "14", title: "Juara 2 LKTI Universitas Indonesia", description: "Karya ilmiah tim KIR SMAN 68 menempati posisi kedua tingkat nasional.", level: "nasional", category: "sains", awardType: "juara2", year: 2023, cover: "/assets/foto-1.jpg", ekskulId: "kir" },
  { id: "15", title: "Medali Perak Kejurnas Atletik", description: "Sprinter SMAN 68 meraih medali perak pada Kejuaraan Nasional Atletik Pelajar.", level: "nasional", category: "olahraga", awardType: "juara2", year: 2022, cover: "/assets/foto-4.jpg", ekskulId: "tracesight" },
];

export type GalleryAlbumContent = { id: string; title: string; category: string; cover: string };

export const galleryAlbums: GalleryAlbumContent[] = [
  { id: "1", title: "Dokumentasi Sekolah", category: "dokumentasi", cover: "/assets/hero-1.png" },
  { id: "2", title: "Kegiatan Siswa", category: "kegiatan", cover: "/assets/foto-1.jpg" },
  { id: "3", title: "Prestasi & Acara", category: "prestasi-acara", cover: "/assets/hero-3.png" },
  { id: "4", title: "Foto Resmi Sekolah", category: "foto-resmi", cover: schoolData.fotoResmi[0].src },
];

export type GalleryPhotoContent = { id: string; src: string; caption: string; albumId?: string };

export const galleryPhotos: GalleryPhotoContent[] = [
  { id: "1", src: "/assets/hero-1.png", caption: "Gedung SMAN 68 Jakarta", albumId: "1" },
  { id: "2", src: "/assets/hero-2.png", caption: "Suasana belajar aktif", albumId: "1" },
  { id: "3", src: "/assets/hero-3.png", caption: "Momen kebanggaan", albumId: "1" },
  { id: "4", src: "/assets/hero-4.jpeg", caption: "Komunitas yang solid", albumId: "1" },
  { id: "5", src: "/assets/foto-1.jpg", caption: "Kegiatan OSIS", albumId: "2" },
  { id: "6", src: "/assets/foto-2.webp", caption: "Science Fair", albumId: "2" },
  { id: "7", src: "/assets/foto-3.jpg", caption: "Kegiatan ekskul", albumId: "2" },
  { id: "8", src: "/assets/foto-4.jpg", caption: "Keseruan bersama", albumId: "2" },
  { id: "9", src: "/assets/hero.png", caption: "Event tahunan", albumId: "3" },
  { id: "10", src: "/assets/foto-1.jpg", caption: "Penerimaan penghargaan", albumId: "3" },
  ...schoolData.fotoResmi.map((foto, i) => ({
    id: `resmi-${i + 1}`,
    src: foto.src,
    caption: foto.alt,
    albumId: "4",
  })),
];

export type FacilityContent = { id: string; name: string; category: string; floor: string; building?: string; capacity?: number; description?: string; images: string[] };

export const facilities: FacilityContent[] = [
  { id: "ruang-kelas", name: "Ruang Kelas", category: "akademik", floor: "Lantai 1", description: "Ruang kelas dengan papan tulis, ventilasi, dan pencahayaan alami — bagian dari 24 ruang kelas sekolah yang seluruhnya tercatat layak (100%).", images: ["/assets/fasilitas/lantai-1/ruang-kelas/1.webp"] },
  { id: "ruang-guru", name: "Ruang Guru", category: "administrasi", floor: "Lantai 1", description: "Ruang kerja seluruh guru dengan meja masing-masing, papan pengumuman, dan area istirahat.", images: ["/assets/fasilitas/lantai-1/ruang-guru/1.webp", "/assets/fasilitas/lantai-1/ruang-guru/2.webp", "/assets/fasilitas/lantai-1/ruang-guru/3.webp", "/assets/fasilitas/lantai-1/ruang-guru/4.webp", "/assets/fasilitas/lantai-1/ruang-guru/5.webp"] },
  { id: "tata-usaha", name: "Tata Usaha", category: "administrasi", floor: "Lantai 1", description: "Pusat layanan administrasi sekolah: surat-menyurat, legalisir, informasi umum, hingga agenda kegiatan sekolah.", images: ["/assets/fasilitas/lantai-1/tata-usaha/1.webp", "/assets/fasilitas/lantai-1/tata-usaha/2.webp", "/assets/fasilitas/lantai-1/tata-usaha/3.webp"] },
  { id: "kepala-sekolah", name: "Ruang Kepala Sekolah", category: "administrasi", floor: "Lantai 1", description: "Ruang kerja kepala sekolah dengan area tamu untuk menerima orang tua, siswa, dan mitra sekolah.", images: ["/assets/fasilitas/lantai-1/kepala-sekolah/1.webp", "/assets/fasilitas/lantai-1/kepala-sekolah/2.webp", "/assets/fasilitas/lantai-1/kepala-sekolah/3.webp", "/assets/fasilitas/lantai-1/kepala-sekolah/4.webp", "/assets/fasilitas/lantai-1/kepala-sekolah/5.webp"] },
  { id: "wakil-kepala", name: "Ruang Wakil Kepala Sekolah", category: "administrasi", floor: "Lantai 1", description: "Ruang kerja para wakil kepala sekolah untuk koordinasi kurikulum, kesiswaan, dan sarana prasarana.", images: ["/assets/fasilitas/lantai-1/wakil-kepala/1.webp", "/assets/fasilitas/lantai-1/wakil-kepala/2.webp"] },
  { id: "uks", name: "Ruang UKS", category: "kesehatan", floor: "Lantai 1", description: "Unit Kesehatan Sekolah dengan tempat perawatan, obat-obatan dasar, dan petugas piket harian.", images: ["/assets/fasilitas/lantai-1/uks/1.webp", "/assets/fasilitas/lantai-1/uks/2.webp"] },
  { id: "piket", name: "Ruang Piket", category: "layanan", floor: "Lantai 1", description: "Meja piket guru untuk mencatat kehadiran, tamu, dan kejadian penting selama kegiatan sekolah.", images: ["/assets/fasilitas/lantai-1/piket/1.webp"] },
  { id: "koperasi", name: "Koperasi Sekolah", category: "umum", floor: "Lantai 1", description: "Koperasi siswa menyediakan alat tulis, seragam, dan kebutuhan belajar lain dengan harga terjangkau.", images: ["/assets/fasilitas/lantai-1/koperasi/1.webp"] },
  { id: "pos-satpam", name: "Pos Satpam", category: "layanan", floor: "Lantai 1", description: "Pos penjagaan di area masuk sekolah untuk menjaga keamanan dan ketertiban warga sekolah.", images: ["/assets/fasilitas/lantai-1/pos-satpam/1.webp"] },
  { id: "gudang-olahraga", name: "Gudang Olahraga", category: "olahraga", floor: "Lantai 1", description: "Penyimpanan peralatan olahraga: bola, net, matras, dan perlengkapan kegiatan lapangan.", images: ["/assets/fasilitas/lantai-1/gudang-olahraga/1.webp"] },
  { id: "audio-visual", name: "Ruang Audio Visual", category: "akademik", floor: "Lantai 1", description: "Ruang pertemuan dengan proyektor dan tata suara untuk presentasi, pelatihan, dan kegiatan siswa.", images: ["/assets/fasilitas/lantai-1/audio-visual/1.webp"] },
  { id: "galeri-prestasi", name: "Galeri Prestasi", category: "umum", floor: "Lantai 1", description: "Deretan piala dan piagam penghargaan siswa serta sekolah yang dipamerkan di lobi sekolah.", images: ["/assets/fasilitas/lantai-1/galeri-prestasi/1.webp", "/assets/fasilitas/lantai-1/galeri-prestasi/2.webp"] },
  { id: "ruang-kelas-2", name: "Ruang Kelas", category: "akademik", floor: "Lantai 2", description: "Ruang kelas di lantai 2 dengan proyektor, meja-kursi siswa, dan pojok baca di bagian belakang kelas.", images: ["/assets/fasilitas/lantai-2/ruang-kelas/1.webp"] },
  { id: "perpustakaan", name: "Perpustakaan", category: "akademik", floor: "Lantai 2", description: "Perpustakaan dengan koleksi buku pelajaran, referensi, dan fiksi; dilengkapi ruang baca, pojok baca, serta layanan digital.", images: ["/assets/fasilitas/lantai-2/perpustakaan/1.webp", "/assets/fasilitas/lantai-2/perpustakaan/2.webp", "/assets/fasilitas/lantai-2/perpustakaan/3.webp", "/assets/fasilitas/lantai-2/perpustakaan/4.webp", "/assets/fasilitas/lantai-2/perpustakaan/5.webp", "/assets/fasilitas/lantai-2/perpustakaan/6.webp", "/assets/fasilitas/lantai-2/perpustakaan/7.webp", "/assets/fasilitas/lantai-2/perpustakaan/8.webp", "/assets/fasilitas/lantai-2/perpustakaan/9.webp"] },
  { id: "lab-komputer", name: "Lab Komputer", category: "akademik", floor: "Lantai 2", description: "Laboratorium komputer untuk pembelajaran informatika dan asesmen berbasis komputer, terhubung jaringan internet sekolah.", images: ["/assets/fasilitas/lantai-2/lab-komputer/1.webp", "/assets/fasilitas/lantai-2/lab-komputer/2.webp", "/assets/fasilitas/lantai-2/lab-komputer/3.webp"] },
  { id: "bk", name: "Ruang BK", category: "layanan", floor: "Lantai 2", description: "Ruang Bimbingan Konseling untuk pendampingan pribadi, sosial, belajar, dan karier siswa.", images: ["/assets/fasilitas/lantai-2/bk/1.webp"] },
  { id: "kelas-xi", name: "Ruang Kelas XI", category: "akademik", floor: "Lantai 3", description: "Ruang kelas lantai 3 dengan tata ruang diskusi kelompok, papan tulis, dan pencahayaan alami.", images: ["/assets/fasilitas/lantai-3/kelas-xi/1.webp"] },
  { id: "lab-biologi", name: "Lab Biologi", category: "akademik", floor: "Lantai 3", description: "Laboratorium biologi dengan mikroskop, torso, dan peralatan praktikum — lengkap dengan ruang persiapan bahan.", images: ["/assets/fasilitas/lantai-3/lab-biologi/1.webp", "/assets/fasilitas/lantai-3/lab-biologi/5.webp", "/assets/fasilitas/lantai-3/lab-biologi/2.webp", "/assets/fasilitas/lantai-3/lab-biologi/3.webp", "/assets/fasilitas/lantai-3/lab-biologi/4.webp"] },
  { id: "agama-kristen", name: "Ruang Agama Kristen", category: "ibadah", floor: "Lantai 3", description: "Ruang pembinaan rohani Kristen untuk ibadah, pendalaman iman, dan kegiatan spiritual siswa.", images: ["/assets/fasilitas/lantai-3/agama-kristen/1.webp", "/assets/fasilitas/lantai-3/agama-kristen/2.webp"] },
  { id: "ruang-kelas-4", name: "Ruang Kelas XII", category: "akademik", floor: "Lantai 4", description: "Ruang kelas lantai 4 dengan pencahayaan alami untuk kegiatan belajar mengajar kelas XII.", images: ["/assets/fasilitas/lantai-4/ruang-kelas-4/1.webp"] },
  { id: "lab-ips", name: "Lab IPS", category: "akademik", floor: "Lantai 4", description: "Laboratorium ilmu pengetahuan sosial untuk pembelajaran berbasis proyek, diskusi, dan pameran karya siswa.", images: ["/assets/fasilitas/lantai-4/lab-ips/1.webp", "/assets/fasilitas/lantai-4/lab-ips/2.webp"] },
  { id: "ruang-elpala", name: "Ruang Elpala", category: "umum", floor: "Lantai 4", description: "Ruang loker siswa dan penyimpanan perlengkapan ekskul seperti pramuka dan kegiatan lapangan.", images: ["/assets/fasilitas/lantai-4/ruang-elpala/1.webp", "/assets/fasilitas/lantai-4/ruang-elpala/2.webp"] },
  { id: "kamar-mandi", name: "Kamar Mandi Wanita", category: "umum", floor: "Lantai 4", description: "Kamar mandi dan toilet siswa putri yang terawat dan dibersihkan setiap hari.", images: ["/assets/fasilitas/lantai-4/kamar-mandi/1.webp", "/assets/fasilitas/lantai-4/kamar-mandi/2.webp"] },
  { id: "ruang-kelas-5", name: "Ruang Kelas", category: "akademik", floor: "Lantai 5", description: "Ruang kelas di lantai 5 dengan pencahayaan alami dan sirkulasi udara yang baik.", images: ["/assets/fasilitas/lantai-5/ruang-kelas/1.webp"] },
  { id: "aula", name: "Aula Serbaguna", category: "umum", floor: "Lantai 5", description: "Aula untuk upacara, pentas seni, sosialisasi, dan kegiatan bersama yang menampung ratusan orang.", images: ["/assets/fasilitas/lantai-5/aula/1.webp", "/assets/fasilitas/lantai-5/aula/2.webp", "/assets/fasilitas/lantai-5/aula/3.webp"] },
  { id: "gym", name: "Ruang Gym & Kebugaran", category: "olahraga", floor: "Lantai 5", description: "Pusat kebugaran dengan treadmill, sepeda statis, dan alat beban untuk siswa dan guru.", images: ["/assets/fasilitas/lantai-5/gym/1.webp", "/assets/fasilitas/lantai-5/gym/2.webp"] },
  { id: "kantin", name: "Kantin Sekolah", category: "umum", floor: "Lantai 5", description: "Kantin dengan aneka pilihan makanan dan minuman yang dijaga kebersihannya.", images: ["/assets/fasilitas/lantai-5/kantin/1.webp", "/assets/fasilitas/lantai-5/kantin/2.webp", "/assets/fasilitas/lantai-5/kantin/3.webp", "/assets/fasilitas/lantai-5/kantin/4.webp"] },
  { id: "lapangan", name: "Lapangan & Halaman", category: "olahraga", floor: "Area Outdoor", description: "Lapangan upacara, olahraga, dan halaman hijau tempat siswa berkumpul dan beraktivitas.", images: ["/assets/fasilitas/outdoor/lapangan/1.webp", "/assets/fasilitas/outdoor/lapangan/2.webp", "/assets/fasilitas/outdoor/lapangan/3.webp", "/assets/fasilitas/outdoor/lapangan/4.webp", "/assets/fasilitas/outdoor/lapangan/5.webp", "/assets/fasilitas/outdoor/lapangan/6.webp"] },
  { id: "masjid", name: "Masjid Darul Ulum", category: "ibadah", floor: "Area Outdoor", description: "Masjid sekolah untuk salat berjamaah, kajian, dan pembinaan keagamaan seluruh warga sekolah.", images: ["/assets/fasilitas/outdoor/masjid/1.webp", "/assets/fasilitas/outdoor/masjid/2.webp", "/assets/fasilitas/outdoor/masjid/3.webp", "/assets/fasilitas/outdoor/masjid/4.webp", "/assets/fasilitas/outdoor/masjid/5.webp", "/assets/fasilitas/outdoor/masjid/6.webp", "/assets/fasilitas/outdoor/masjid/7.webp", "/assets/fasilitas/outdoor/masjid/8.webp", "/assets/fasilitas/outdoor/masjid/9.webp"] },
  { id: "climbing-wall", name: "Climbing Wall", category: "olahraga", floor: "Area Outdoor", description: "Dinding panjat untuk latihan dan ekstrakurikuler panjat tebing siswa.", images: ["/assets/fasilitas/outdoor/climbing-wall/1.webp"] },
  { id: "kompos", name: "Area Kompos & Tanaman", category: "umum", floor: "Area Outdoor", description: "Area pengolahan kompos dan penghijauan sekolah untuk pembelajaran lingkungan hidup.", images: ["/assets/fasilitas/outdoor/kompos/1.webp", "/assets/fasilitas/outdoor/kompos/2.webp"] },
];

export const facilityHighlights: { id: string; title: string; description: string; image: string }[] = [
  { id: "perpustakaan", title: "Perpustakaan", description: "Ruang baca & pojok literasi", image: "/assets/fasilitas/lantai-2/perpustakaan/1.webp" },
  { id: "laboratorium-riset", title: "Laboratorium & Riset", description: "Biologi, komputer, IPS", image: "/assets/fasilitas/lantai-3/lab-biologi/1.webp" },
  { id: "lapangan-ekskul", title: "Lapangan & Ekskul", description: "Upacara, basket, panjat tebing", image: "/assets/fasilitas/outdoor/lapangan/1.webp" },
  { id: "aula-kegiatan", title: "Aula & Kegiatan", description: "Pentas seni & pertemuan", image: "/assets/fasilitas/lantai-5/aula/1.webp" },
];

export type TeacherContent = { id: string; name: string; subject: string; position: string; photo: string; email?: string };

export const teachers: TeacherContent[] = [
  { id: "1", name: "Drs. Ahmad Fauzi, M.Pd.", subject: "Matematika", position: "Guru Senior", photo: "https://randomuser.me/api/portraits/men/51.jpg" },
  { id: "2", name: "Dra. Ratna Dewi, M.Hum.", subject: "Bahasa Indonesia", position: "Kepala Jurusan Bahasa", photo: "https://randomuser.me/api/portraits/women/56.jpg" },
  { id: "3", name: "Budi Santoso, S.Pd.", subject: "Fisika", position: "Guru & Wali Kelas", photo: "https://randomuser.me/api/portraits/men/41.jpg" },
  { id: "4", name: "Siti Rahayu, S.Pd., M.Si.", subject: "Kimia", position: "Guru Senior", photo: "https://randomuser.me/api/portraits/women/47.jpg" },
  { id: "5", name: "Eko Prasetyo, S.T.", subject: "Informatika", position: "Pembina Robotika", photo: "https://randomuser.me/api/portraits/men/29.jpg" },
  { id: "6", name: "Nurul Hidayah, S.Pd.", subject: "Bahasa Inggris", position: "Guru & Pembina Debat", photo: "https://randomuser.me/api/portraits/women/26.jpg" },
  { id: "7", name: "Hendra Gunawan, M.Pd.", subject: "Sejarah", position: "Guru Senior", photo: "https://randomuser.me/api/portraits/men/85.jpg" },
  { id: "8", name: "Rina Kusuma, S.Pd.", subject: "Seni Budaya", position: "Pembina Paduan Suara", photo: "https://randomuser.me/api/portraits/women/60.jpg" },
  { id: "9", name: "Dr. Wahyu Santoso", subject: "Biologi", position: "Koordinator Olimpiade", photo: "https://randomuser.me/api/portraits/men/64.jpg" },
  { id: "10", name: "Maya Indah, S.Psi.", subject: "Bimbingan Konseling", position: "Guru BK", photo: "https://randomuser.me/api/portraits/women/50.jpg" },
  { id: "11", name: "Fajar Ramadhan, S.Pd.", subject: "Pendidikan Jasmani", position: "Pembina PASKIBRA", photo: "https://randomuser.me/api/portraits/men/11.jpg" },
  { id: "12", name: "Dewi Astuti, S.Pd.", subject: "Ekonomi", position: "Wali Kelas XII IPS", photo: "https://randomuser.me/api/portraits/women/16.jpg" },
];

export type TestimonialContent = { id: string; name: string; role: string; quote: string; photo: string };

export const testimonials: TestimonialContent[] = [
  { id: "1", name: "Rafi Ahmad", role: "Siswa Kelas XI IPA", quote: "SMAN 68 bukan sekolah biasa. Di sini aku bukan hanya belajar — aku tumbuh. Ekskul, kompetisi, persahabatan — semua ada di SMAN 68.", photo: "RA" },
  { id: "2", name: "Dani Kusuma", role: "Alumni 2020, Software Engineer", quote: "Empat tahun di SMAN 68 membentuk siapa aku sekarang. Mentalitas berprestasi, kolaborasi, dan keberanian untuk bermimpi besar — semua dimulai dari sini.", photo: "DK" },
  { id: "3", name: "Ibu Dewi Santoso", role: "Orang Tua Siswa", quote: "Sebagai orang tua, saya bangga melihat anak saya berkembang di SMAN 68. Sekolah ini benar-benar peduli pada karakter siswa, bukan hanya nilai akademik.", photo: "DS" },
  { id: "4", name: "Pak Ahmad Ridwan", role: "Guru Matematika", quote: "Mengajar di SMAN 68 adalah kebanggaan. Siswa di sini tidak hanya cerdas — mereka juga punya karakter. Setiap hari adalah inspirasi bagi saya.", photo: "AR" },
];

export const peoplePhotos: { src: string; alt: string }[] = [
  { src: "/assets/foto-2.webp", alt: "Science Fair" },
  { src: "/assets/foto-1.jpg", alt: "OSIS 2024" },
  { src: "/assets/foto-3.jpg", alt: "Kegiatan Siswa" },
  { src: "/assets/foto-4.jpg", alt: "Ekskul" },
  { src: "/assets/hero-4.jpeg", alt: "Komunitas" },
];

export type FaqContent = { id: string; question: string; answer: string; category: string };

export const faqs: FaqContent[] = [
  {
    id: "ppdb-1",
    question: "Jalur apa saja yang tersedia di PPDB SMAN 68?",
    answer: "PPDB SMAN 68 Jakarta membuka 4 jalur: Zonasi (50%), Afirmasi (15%), Perpindahan Tugas (5%), dan Prestasi (30%). Setiap jalur memiliki persyaratan dan kuota tersendiri.",
    category: "ppdb",
  },
  {
    id: "ppdb-2",
    question: "Bagaimana sistem zonasi di SMAN 68?",
    answer: "Zonasi SMAN 68 Jakarta mencakup beberapa kelurahan di Jakarta Pusat. Prioritas diberikan kepada calon siswa yang berdomisili paling dekat dengan sekolah berdasarkan jarak.",
    category: "ppdb",
  },
  {
    id: "ppdb-3",
    question: "Apakah ada tes masuk di SMAN 68?",
    answer: "Tidak ada tes akademik tertulis. Seleksi dilakukan berdasarkan nilai rapor, prestasi (untuk jalur prestasi), dan jarak domisili (untuk jalur zonasi).",
    category: "ppdb",
  },
  {
    id: "ppdb-4",
    question: "Berapa kuota total siswa baru SMAN 68?",
    answer: `SMAN 68 Jakarta menerima sekitar ${schoolData.intakePpdb.estimasiSiswa} siswa baru per tahun, dibagi dalam ${schoolData.intakePpdb.rombel} rombongan belajar dengan ${schoolData.intakePpdb.perKelas} siswa per kelas.`,
    category: "ppdb",
  },
  {
    id: "umum-1",
    question: "Bagaimana cara mendaftar ke SMAN 68 Jakarta?",
    answer: "Pendaftaran dilakukan melalui portal resmi PPDB DKI Jakarta di ppdb.jakarta.go.id. Pilih jalur yang sesuai (Zonasi, Afirmasi, Perpindahan Tugas, atau Prestasi), isi formulir, dan unggah dokumen yang dipersyaratkan.",
    category: "umum",
  },
  {
    id: "umum-2",
    question: "Apakah ada biaya pendaftaran?",
    answer: "Tidak. Seluruh proses PPDB tidak dipungut biaya. Waspadai pihak yang meminta pembayaran dengan alasan apa pun — pendaftaran hanya sah melalui portal resmi.",
    category: "umum",
  },
  {
    id: "umum-3",
    question: "Apa saja jalur PPDB yang tersedia?",
    answer: "Empat jalur: Zonasi (kuota terbesar, berdasarkan jarak domisili), Afirmasi (KIP/KKS dan disabilitas), Perpindahan Tugas orang tua, dan Prestasi (nilai rapor serta prestasi akademik/non-akademik).",
    category: "umum",
  },
  {
    id: "umum-4",
    question: "Dokumen apa yang harus disiapkan?",
    answer: "Kartu Keluarga (KK) asli dan fotokopi, Akta Kelahiran, Ijazah/SKHUN SMP atau sederajat, rapor SMP semester 1–5, pas foto 3x4 latar merah, dan sertifikat prestasi (jika ada).",
    category: "umum",
  },
  {
    id: "umum-5",
    question: "Bagaimana perhitungan jalur zonasi?",
    answer: "Zonasi dihitung berdasarkan jarak domisili (sesuai KK) ke sekolah. Pastikan alamat KK sesuai domisili sebenarnya karena jarak berpengaruh besar pada peluang diterima.",
    category: "umum",
  },
  {
    id: "umum-6",
    question: "Apakah siswa dari luar Jakarta bisa mendaftar?",
    answer: "Jalur Zonasi dan Afirmasi diperuntukkan bagi warga DKI Jakarta sesuai domisili KK. Siswa luar Jakarta umumnya melalui jalur Prestasi atau Perpindahan Tugas — periksa juknis resmi PPDB DKI untuk ketentuan terbaru.",
    category: "umum",
  },
  {
    id: "umum-7",
    question: "Kapan jadwal PPDB dibuka?",
    answer: "Jadwal lengkap per jalur diumumkan di portal resmi PPDB DKI Jakarta dan halaman PPDB situs ini. Pantau bagian \"Alur & Jadwal\" serta pengumuman sekolah agar tidak tertinggal.",
    category: "umum",
  },
  {
    id: "umum-8",
    question: "Bagaimana cara mengetahui hasil seleksi?",
    answer: "Hasil seleksi diumumkan melalui portal resmi PPDB DKI Jakarta sesuai tanggal yang ditetapkan. Jika diterima, lakukan daftar ulang pada jadwal yang ditentukan.",
    category: "umum",
  },
  {
    id: "umum-9",
    question: "Apa yang terjadi jika tidak melakukan daftar ulang?",
    answer: "Siswa yang diterima namun tidak melakukan daftar ulang pada jadwal yang ditetapkan dianggap mengundurkan diri, dan kursinya akan diberikan kepada pendaftar cadangan.",
    category: "umum",
  },
  {
    id: "umum-10",
    question: "Apakah SMAN 68 menyediakan beasiswa?",
    answer: "Ya. Tersedia jalur bantuan seperti KIP/PIP, beasiswa prestasi, serta bantuan khusus yang dikoordinasikan dengan komite sekolah. Detailnya ada di halaman Biaya & Beasiswa.",
    category: "umum",
  },
  {
    id: "umum-11",
    question: "Fasilitas apa saja yang dimiliki SMAN 68?",
    answer: "24 ruang kelas (seluruhnya layak), perpustakaan, lab biologi, lab komputer, lab IPS, ruang audio visual, ruang BK, UKS, koperasi, aula, kantin, gym, Masjid Darul Ulum, lapangan & halaman, climbing wall, serta area kompos. Lihat halaman Fasilitas untuk denah dan galeri foto tiap ruangan.",
    category: "umum",
  },
  {
    id: "umum-12",
    question: "Siapa yang bisa dihubungi untuk pertanyaan lain?",
    answer: `Hubungi Tata Usaha di ${schoolData.kontak.telepon} atau email ${schoolData.kontak.email} pada hari dan jam kerja sekolah.`,
    category: "umum",
  },
];

export const ppdbSteps: { title: string; description: string }[] = [
  { title: "Kumpulkan Berkas, Santai Saja", description: "Daftar centang dokumen sudah kami siapkan — tidak ada yang terlewat." },
  { title: "Daftar dari Rumah", description: "Lima langkah simpel di portal resmi; panitia siap membantu lewat chat." },
  { title: "Tunggu Kabar Baiknya", description: "Pantau status dengan tenang — kami kabari setiap tahap." },
  { title: "Selamat, Saatnya Bergabung!", description: "Selesaikan daftar ulang tanpa biaya, lalu kenalan di orientasi siswa baru." },
];

export const ppdbSchedule: { label: string; date: string; note?: string }[] = [
  { label: "Pendaftaran Zonasi", date: "3 – 7 Juni 2025" },
  { label: "Verifikasi Dokumen", date: "8 – 10 Juni 2025" },
  { label: "Pengumuman Zonasi", date: "12 Juni 2025" },
  { label: "Pendaftaran Prestasi", date: "15 – 20 Juni 2025" },
  { label: "Pengumuman Final", date: "25 Juni 2025" },
  { label: "Daftar Ulang", date: "26 – 30 Juni 2025" },
];

export const ppdbFees: { label: string; amount: string; note?: string }[] = [
  { label: "SPP / Uang Sekolah", amount: "Gratis", note: "Sebagai sekolah negeri, tidak ada biaya SPP bulanan." },
  { label: "Seragam & Atribut", amount: "Sesuai toko", note: "Dibeli mandiri di toko resmi; sekolah tidak menetapkan markup." },
  { label: "Kegiatan & Ekstrakurikuler", amount: "Sukarela", note: "Kontribusi kegiatan bersifat sukarela melalui komite sekolah." },
  { label: "Study Tour / Kunjungan Belajar", amount: "Opsional", note: "Hanya untuk yang berminat, dengan rincian anggaran transparan." },
];

export const ppdbScholarships: { title: string; description: string }[] = [
  { title: "KIP / PIP", description: "Bantuan pemerintah bagi siswa dari keluarga kurang mampu. Pendaftaran melalui sekolah dengan membawa KIP/KKS." },
  { title: "Beasiswa Prestasi", description: "Apresiasi bagi siswa berprestasi akademik maupun non-akademik di tingkat kota hingga internasional." },
  { title: "Bantuan Khusus", description: "Dukungan bagi siswa yatim/piatu dan kondisi khusus lainnya, dikoordinasikan dengan komite sekolah." },
];
