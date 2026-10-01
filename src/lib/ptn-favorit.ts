export type PtnFavorit = {
  rank: number;
  slug: string;
  nama: string;
  singkat: string;
  kota: string;
  provinsi: string;
  website: string;
  admisi: { label: string; url: string };
  /** Logo di /public/assets/kampus. Undip & UNS memakai monogram SVG. */
  logo?: string;
  /** Kalimat pendek untuk tampilan ringkas (maks ± 8 kata). */
  tagline: string;
  tentang: string;
  unggulan: string[];
};

/**
 * Top 10 PTN favorit lulusan SMAN 68 Jakarta.
 * Urutan disusun dari jejak alumni & hasil SNBP/SNBT beberapa tahun terakhir,
 * bukan peringkat resmi nasional. Tautan admisi sudah diverifikasi ke situs resmi.
 */
export const PTN_FAVORIT: PtnFavorit[] = [
  {
    rank: 1,
    slug: "universitas-indonesia",
    nama: "Universitas Indonesia",
    singkat: "UI",
    kota: "Depok",
    provinsi: "Jawa Barat",
    website: "https://www.ui.ac.id",
    admisi: { label: "Penerimaan UI", url: "https://penerimaan.ui.ac.id" },
    logo: "/assets/kampus/ui.png",
    tagline: "Terdekat dari Jakarta, jejaring alumni terbesar.",
    tentang:
      "Kampus negeri terdekat dari Jakarta Pusat dengan jejaring alumni SMAN 68 terbesar. Tujuan utama untuk Kedokteran, Ilmu Komputer, Hukum, dan Psikologi.",
    unggulan: ["Kedokteran", "Ilmu Komputer", "Hukum", "Psikologi"],
  },
  {
    rank: 2,
    slug: "universitas-gadjah-mada",
    nama: "Universitas Gadjah Mada",
    singkat: "UGM",
    kota: "Yogyakarta",
    provinsi: "DI Yogyakarta",
    website: "https://www.ugm.ac.id",
    admisi: { label: "UM UGM", url: "https://um.ugm.ac.id" },
    logo: "/assets/kampus/ugm.png",
    tagline: "Kampus tertua dengan riset terkuat.",
    tentang:
      "Universitas tertua di Indonesia. Favorit anak IPS (FISIPOL, FEB, Hukum) maupun MIPA (Kedokteran, Teknik) dengan biaya hidup mahasiswa yang ramah.",
    unggulan: ["Kedokteran", "Hubungan Internasional", "Manajemen", "Teknik"],
  },
  {
    rank: 3,
    slug: "institut-teknologi-bandung",
    nama: "Institut Teknologi Bandung",
    singkat: "ITB",
    kota: "Bandung",
    provinsi: "Jawa Barat",
    website: "https://www.itb.ac.id",
    admisi: { label: "Admission ITB", url: "https://admission.itb.ac.id" },
    logo: "/assets/kampus/itb.png",
    tagline: "Teknik dan desain terbaik nasional.",
    tentang:
      "Kampus teknik dan desain terbaik nasional. Langganan anak olimpiade, robotika, dan DKV. Seleksi per fakultas/sekolah, bukan per prodi.",
    unggulan: ["STEI Informatika", "DKV FSRD", "Arsitektur", "Teknik Elektro"],
  },
  {
    rank: 4,
    slug: "institut-pertanian-bogor",
    nama: "IPB University",
    singkat: "IPB",
    kota: "Bogor",
    provinsi: "Jawa Barat",
    website: "https://www.ipb.ac.id",
    admisi: { label: "Admisi IPB", url: "https://admisi.ipb.ac.id" },
    logo: "/assets/kampus/ipb.png",
    tagline: "Satu jam dari Jakarta via KRL.",
    tentang:
      "Sekitar satu jam dari Jakarta via KRL. Jalur PIN memberi peluang khusus untuk ketua OSIS dan penghafal Al-Qur'an.",
    unggulan: ["Kedokteran Hewan", "Statistika", "Ilmu Komputer", "Agribisnis"],
  },
  {
    rank: 5,
    slug: "universitas-padjadjaran",
    nama: "Universitas Padjadjaran",
    singkat: "Unpad",
    kota: "Jatinangor",
    provinsi: "Jawa Barat",
    website: "https://www.unpad.ac.id",
    admisi: { label: "SMUP Unpad", url: "https://smup.unpad.ac.id" },
    logo: "/assets/kampus/unpad.png",
    tagline: "Soshum kuat, Fikom terbaik nasional.",
    tentang:
      "Kampus Soshum kuat di Jatinangor. Fikom salah satu terbaik nasional, dengan Kedokteran dan Hukum sebagai jangkar favorit.",
    unggulan: ["Ilmu Komunikasi", "Hukum", "Kedokteran", "Manajemen"],
  },
  {
    rank: 6,
    slug: "universitas-negeri-jakarta",
    nama: "Universitas Negeri Jakarta",
    singkat: "UNJ",
    kota: "Jakarta Timur",
    provinsi: "DKI Jakarta",
    website: "https://www.unj.ac.id",
    admisi: { label: "Penmaba UNJ", url: "https://penmaba.unj.ac.id" },
    logo: "/assets/kampus/unj.png",
    tagline: "Kampus dalam kota, UKT paling ringan.",
    tentang:
      "Kampus dalam kota tanpa biaya kos dengan UKT paling ringan. Basis keguruan terkuat plus Psikologi dan Manajemen yang makin diminati.",
    unggulan: ["Psikologi", "Pendidikan", "Manajemen", "Ilmu Komputer"],
  },
  {
    rank: 7,
    slug: "universitas-brawijaya",
    nama: "Universitas Brawijaya",
    singkat: "UB",
    kota: "Malang",
    provinsi: "Jawa Timur",
    website: "https://ub.ac.id",
    admisi: { label: "SELMA UB", url: "https://selma.ub.ac.id" },
    logo: "/assets/kampus/ub.png",
    tagline: "Daya tampung besar, peluang lolos tinggi.",
    tentang:
      "Daya tampung besar dengan tingkat keketatan menengah. Peluang lolos tinggi tanpa kehilangan gengsi, dan Malang nyaman untuk anak rantau.",
    unggulan: ["Kedokteran", "FILKOM", "Administrasi Publik", "Hukum"],
  },
  {
    rank: 8,
    slug: "universitas-airlangga",
    nama: "Universitas Airlangga",
    singkat: "Unair",
    kota: "Surabaya",
    provinsi: "Jawa Timur",
    website: "https://www.unair.ac.id",
    admisi: { label: "PPMB Unair", url: "https://ppmb.unair.ac.id" },
    logo: "/assets/kampus/unair.png",
    tagline: "Pusat kesehatan Indonesia timur.",
    tentang:
      "Pusat ilmu kesehatan Indonesia timur dengan RS Dr. Soetomo sebagai RS pendidikan terbesar. Farmasi dan Psikologi jadi opsi strategis.",
    unggulan: ["Kedokteran", "Farmasi", "Psikologi", "Ekonomi"],
  },
  {
    rank: 9,
    slug: "universitas-diponegoro",
    nama: "Universitas Diponegoro",
    singkat: "Undip",
    kota: "Semarang",
    provinsi: "Jawa Tengah",
    website: "https://www.undip.ac.id",
    admisi: { label: "PMB Undip", url: "https://pmb.undip.ac.id" },
    logo: "/assets/kampus/undip.svg",
    tagline: "Kedokteran & teknik kuat di Semarang.",
    tentang:
      "Kampus besar di Semarang dengan Kedokteran dan Teknik yang kuat. Biaya hidup moderat dan kota pelajar yang tenang.",
    unggulan: ["Kedokteran", "Teknik", "FISIP", "FEB"],
  },
  {
    rank: 10,
    slug: "universitas-sebelas-maret",
    nama: "Universitas Sebelas Maret",
    singkat: "UNS",
    kota: "Surakarta",
    provinsi: "Jawa Tengah",
    website: "https://uns.ac.id",
    admisi: { label: "SPMB UNS", url: "https://spmb.uns.ac.id" },
    logo: "/assets/kampus/uns.svg",
    tagline: "Keguruan & seni solid di Solo.",
    tentang:
      "Kampus besar di Solo dengan keguruan, kedokteran, dan seni rupa yang solid. Biaya hidup ringan dan suasana kota yang mendukung fokus belajar.",
    unggulan: ["Kedokteran", "FKIP", "Sastra", "Seni Rupa"],
  },
];

/** Tautan langsung ke direktori alumni yang tersaring per kampus. */
export const alumniUrlFor = (nama: string): string =>
  `/komunitas/alumni?kampus=${encodeURIComponent(nama)}#direktori`;
