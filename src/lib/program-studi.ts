import {
  Atom,
  BookOpen,
  BookType,
  Code2,
  Compass,
  Dna,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  PenLine,
  Scale,
  Sigma,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export type SubjectBook = {
  title: string;
  author: string;
  publisher: string;
  year: number;
};

export type SubjectContent = {
  name: string;
  icon: LucideIcon;
  /** Kelas tailwind untuk badge logo mata pelajaran (gradien + ring). */
  tone: string;
  desc: string;
  /** Buku bacaan yang digunakan atau relevan untuk mata pelajaran ini. */
  books: SubjectBook[];
};

export type StudyProgramContent = {
  id: string;
  name: string;
  fullName: string;
  desc: string;
  icon: LucideIcon;
  kelas: string;
  rombel: string;
  /** Kelas gradien panel program. */
  panel: string;
  subjects: SubjectContent[];
};

export const studyPrograms: StudyProgramContent[] = [
  {
    id: "ipa",
    name: "IPA",
    fullName: "Ilmu Pengetahuan Alam (MIPA)",
    desc: "Pendalaman matematika dan sains dengan praktikum laboratorium, proyek riset, serta pembinaan olimpiade sains.",
    icon: FlaskConical,
    kelas: "Kelas X–XII",
    rombel: "5 Rombel",
    panel: "from-brand-pine via-brand-pine to-brand-green/70",
    subjects: [
      {
        name: "Matematika",
        icon: Sigma,
        tone: "bg-gradient-to-br from-sky-500/15 to-sky-500/5 text-sky-600 ring-1 ring-inset ring-sky-500/20",
        desc: "Aljabar, kalkulus, statistika, dan pemodelan masalah.",
        books: [
          { title: "Matematika SMA Kelas XI", author: "Budi Wahyudi, dkk.", publisher: "Erlangga", year: 2021 },
          { title: "Matematika SMA Kelas XII", author: "Budi Wahyudi, dkk.", publisher: "Erlangga", year: 2022 },
          { title: "Kalkulus", author: "James Stewart", publisher: "Erlangga", year: 2018 },
          { title: "Matematika SMA untuk SMA Kelas XI", author: "Tim Grasindo", publisher: "Grasindo", year: 2020 },
        ],
      },
      {
        name: "Fisika",
        icon: Atom,
        tone: "bg-gradient-to-br from-brand-green/15 to-brand-green/5 text-brand-green ring-1 ring-inset ring-brand-green/20",
        desc: "Mekanika, listrik, gelombang, dan fenomena alam.",
        books: [
          { title: "Fisika SMA Kelas XI", author: "Yos Sudarso", publisher: "Erlangga", year: 2021 },
          { title: "Fisika SMA Kelas XII", author: "Yos Sudarso", publisher: "Erlangga", year: 2022 },
          { title: "Fisika", author: "Tipler &amp; Mosca", publisher: "Grasindo", year: 2019 },
          { title: "Konsep Fisika", author: "Robert Resnick", publisher: "Erlangga", year: 2017 },
        ],
      },
      {
        name: "Kimia",
        icon: FlaskConical,
        tone: "bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 ring-1 ring-inset ring-amber-500/20",
        desc: "Struktur materi, reaksi, dan praktikum laboratorium.",
        books: [
          { title: "Kimia SMA Kelas XI", author: "Ari Syahril, dkk.", publisher: "Erlangga", year: 2021 },
          { title: "Kimia SMA Kelas XII", author: "Ari Syahril, dkk.", publisher: "Erlangga", year: 2022 },
          { title: "Kimia Dasar", author: "Raymond Chang", publisher: "Erlangga", year: 2018 },
          { title: "Soal Kimia SMA", author: "Soni Amiardjia, dkk.", publisher: "Laskar", year: 2019 },
        ],
      },
      {
        name: "Biologi",
        icon: Dna,
        tone: "bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 ring-1 ring-inset ring-emerald-500/20",
        desc: "Sel, genetika, ekosistem, dan praktikum hayati.",
        books: [
          { title: "Biologi SMA Kelas XI", author: "Dina Agustina, dkk.", publisher: "Erlangga", year: 2021 },
          { title: "Biologi SMA Kelas XII", author: "Dina Agustina, dkk.", publisher: "Erlangga", year: 2022 },
          { title: "Biologi: Concepts &amp; Connections", author: "Reece, dkk.", publisher: "Pearson", year: 2017 },
          { title: "Buku Saku Biologi SMA", author: "Nita Amalia", publisher: "Laskar", year: 2020 },
        ],
      },
      {
        name: "Informatika",
        icon: Code2,
        tone: "bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 text-cyan-700 ring-1 ring-inset ring-cyan-500/20",
        desc: "Algoritma, pemrograman, dan literasi digital.",
        books: [
          { title: "Informatika SMA Kelas XI", author: "Rinto Haritama", publisher: "Yudhistira", year: 2021 },
          { title: "Informatika SMA Kelas XII", author: "Rinto Haritama", publisher: "Yudhistira", year: 2022 },
          { title: "Algoritma dan Struktur Data", author: "Rizky Romantho", publisher: "Grasindo", year: 2019 },
          { title: "Belajar Pemrograman Python", author: "Abdul WC Aziz", publisher: "Garuda", year: 2020 },
        ],
      },
    ],
  },
  {
    id: "ips",
    name: "IPS",
    fullName: "Ilmu Pengetahuan Sosial",
    desc: "Kajian ekonomi, geografi, sosiologi, dan sejarah melalui pembelajaran berbasis proyek dan studi kasus.",
    icon: Globe2,
    kelas: "Kelas X–XII",
    rombel: "3 Rombel",
    panel: "from-brand-green via-brand-green to-brand-leaf/80",
    subjects: [
      {
        name: "Ekonomi",
        icon: TrendingUp,
        tone: "bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 ring-1 ring-inset ring-amber-500/20",
        desc: "Pasar, akuntansi, dan kebijakan ekonomi.",
        books: [
          { title: "Ekonomi SMA Kelas XI", author: "Bocklee, dkk.", publisher: "Erlangga", year: 2021 },
          { title: "Ekonomi SMA Kelas XII", author: "Bocklee, dkk.", publisher: "Erlangga", year: 2022 },
          { title: "Pengantar Ekonomi", author: "N. Gregory Mankiw", publisher: "Erlangga", year: 2018 },
          { title: "Ekonomi Indonesia: Ringkasan dan Analisis", author: "Anwar Nasution", publisher: "Laskar", year: 2019 },
        ],
      },
      {
        name: "Geografi",
        icon: Globe2,
        tone: "bg-gradient-to-br from-sky-500/15 to-sky-500/5 text-sky-600 ring-1 ring-inset ring-sky-500/20",
        desc: "Bumi, iklim, pemetaan, dan lingkungan.",
        books: [
          { title: "Geografi SMA Kelas XI", author: "Robin G. L.", publisher: "Erlangga", year: 2021 },
          { title: "Geografi SMA Kelas XII", author: "Robin G. L.", publisher: "Erlangga", year: 2022 },
          { title: "Geografi: Fisik dan Nonfisik", author: "Dedi Kusmana", publisher: "Laskar", year: 2019 },
          { title: "Atlas Indonesia dan Dunia", author: "Paddy', dkk.", publisher: "KPG", year: 2020 },
        ],
      },
      {
        name: "Sosiologi",
        icon: Users,
        tone: "bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-danger-deep ring-1 ring-inset ring-danger/20",
        desc: "Masyarakat, interaksi sosial, dan perubahan sosial.",
        books: [
          { title: "Sosiologi SMA Kelas XI", author: "Bagus Rahman, dkk.", publisher: "Erlangga", year: 2021 },
          { title: "Sosiologi SMA Kelas XII", author: "Endang Soemiati, dkk.", publisher: "Erlangga", year: 2022 },
          { title: "Pengantar Sosiologi", author: "Soekanto", publisher: "Rajawali Pers", year: 2017 },
          { title: "Sosiologi: Suatu Pengantar", author: "A. Riyadi", publisher: "Yudhistira", year: 2019 },
        ],
      },
      {
        name: "Sejarah",
        icon: Landmark,
        tone: "bg-gradient-to-br from-brand-green/15 to-brand-green/5 text-brand-green ring-1 ring-inset ring-brand-green/20",
        desc: "Peristiwa dunia & Indonesia serta analisis sumber.",
        books: [
          { title: "Sejarah SMA Kelas XI", author: "Rachmat Hidayat", publisher: "Erlangga", year: 2021 },
          { title: "Sejarah SMA Kelas XII", author: "Rachmat Hidayat", publisher: "Erlangga", year: 2022 },
          { title: "Pengantar Sejarah Indonesia Modern", author: "Monic S. H. Manayaghi", publisher: "Laskar", year: 2018 },
          { title: "A History of Indonesia", author: "Ricklefs, dkk.", publisher: "Blackwell", year: 2017 },
        ],
      },
      {
        name: "PKn",
        icon: Scale,
        tone: "bg-gradient-to-br from-teal-500/15 to-teal-500/5 text-teal-700 ring-1 ring-inset ring-teal-500/20",
        desc: "Pancasila, konstitusi, dan kewarganegaraan.",
        books: [
          { title: "PPKn SMA Kelas XI", author: "Heryana Herman", publisher: "Yudhistira", year: 2021 },
          { title: "PPKn SMA Kelas XII", author: "Wiliyatmoko, dkk.", publisher: "Yudhistira", year: 2022 },
          { title: "Dasar-Dasar Hukum Tata Negara", author: "Lutfi G. dkk.", publisher: "Rajawali Pers", year: 2019 },
          { title: "Judisprudensi &amp; Demokrasi", author: "Roziqin, dkk.", publisher: "Laskar", year: 2020 },
        ],
      },
    ],
  },
  {
    id: "bahasa",
    name: "Bahasa",
    fullName: "Bahasa & Sastra",
    desc: "Penguatan kemampuan linguistik dan apresiasi sastra melalui praktik berbicara, menulis, dan kajian budaya.",
    icon: BookOpen,
    kelas: "Kelas X–XII",
    rombel: "2 Rombel",
    panel: "from-brand-pine via-brand-green to-brand-leaf/80",
    subjects: [
      {
        name: "Bahasa Indonesia",
        icon: BookOpen,
        tone: "bg-gradient-to-br from-brand-green/15 to-brand-green/5 text-brand-green ring-1 ring-inset ring-brand-green/20",
        desc: "Sastra, teks fungsional, dan keterampilan berbahasa.",
        books: [
          { title: "Bahasa Indonesia SMA Kelas XI", author: "L. Maryati, dkk.", publisher: "Erlangga", year: 2021 },
          { title: "Bahasa Indonesia SMA Kelas XII", author: "L. Maryati, dkk.", publisher: "Erlangga", year: 2022 },
          { title: "Kamus Besar Bahasa Indonesia Edisi V", author: "Pusat Bahasa", publisher: "Balai Pustaka", year: 2016 },
          { title: "Pengantar Histoire Sastra", author: "Jamaludin", publisher: "Rineka Cipta", year: 2017 },
        ],
      },
      {
        name: "Bahasa Inggris",
        icon: Languages,
        tone: "bg-gradient-to-br from-sky-500/15 to-sky-500/5 text-sky-600 ring-1 ring-inset ring-sky-500/20",
        desc: "Komunikasi global dan apresiasi sastra.",
        books: [
          { title: "English for SMA Grade XI", author: "Artono Wardiman, dkk.", publisher: "Erlangga", year: 2021 },
          { title: "English for SMA Grade XII", author: "Artono Wardiman, dkk.", publisher: "Erlangga", year: 2022 },
          { title: "English Grammar in Use", author: "Raymond Murphy", publisher: "Cambridge University Press", year: 2019 },
          { title: "Oxford Learner's Dictionary", author: "Oxford University Press", publisher: "Oxford University Press", year: 2020 },
        ],
      },
      {
        name: "Bahasa Jepang",
        icon: BookType,
        tone: "bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-danger-deep ring-1 ring-inset ring-danger/20",
        desc: "Bahasa dan budaya Jepang tingkat dasar–menengah.",
        books: [
          { title: "Minna no Nihongo Shokyu I", author: "Mutsuko Uriu, dkk.", publisher: "3A Network", year: 2019 },
          { title: "Minna no Nihongo Shokyu II", author: "Mutsuko Uriu, dkk.", publisher: "3A Network", year: 2019 },
          { title: "Pengantar Tata Bahasa Jepang", author: "Hiromi Oka", publisher: "Yudhistira", year: 2020 },
          { title: "Kanji Look and Learn", author: "Heisig &amp; Henshall", publisher: "Tuttle Publishing", year: 2017 },
        ],
      },
      {
        name: "Sastra Indonesia",
        icon: PenLine,
        tone: "bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 ring-1 ring-inset ring-amber-500/20",
        desc: "Puisi, prosa, drama, dan kritik sastra.",
        books: [
          { title: "Sastra Indonesia SMA Kelas XI", author: "Aprilati S. Suryana, dkk.", publisher: "Erlangga", year: 2021 },
          { title: "Sastra Indonesia SMA Kelas XII", author: "Aprilati S. Suryana, dkk.", publisher: "Erlangga", year: 2022 },
          { title: "Sejarah Sastra Indonesia", author: "A. Teeuw", publisher: "Yayasan Obor Indonesia", year: 2018 },
          { title: "Jejak Seni dalam Sastra Indonesia", author: "Sholeh Basah", publisher: "Diksi Insan Mulia", year: 2019 },
        ],
      },
      {
        name: "Antropologi",
        icon: Compass,
        tone: "bg-gradient-to-br from-teal-500/15 to-teal-500/5 text-teal-700 ring-1 ring-inset ring-teal-500/20",
        desc: "Budaya, tradisi, dan kehidupan masyarakat.",
        books: [
          { title: "Antropologi SMA Kelas XI", author: "B. Setiadi, dkk.", publisher: "Erlangga", year: 2021 },
          { title: "Antropologi Budaya Indonesia", author: "Elizabeth A. Davis", publisher: "Laskar", year: 2019 },
          { title: "An Introduction to Anthropology", author: "Michael D. Coe", publisher: "Mayfield", year: 2017 },
          { title: "Orang Indonesia", author: "Tjipta N. Sutardjo", publisher: "Balai Pustaka", year: 2018 },
        ],
      },
    ],
  },
];
