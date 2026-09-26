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

export type SubjectContent = {
  name: string;
  icon: LucideIcon;
  /** Kelas tailwind untuk badge logo mata pelajaran (gradien + ring). */
  tone: string;
  desc: string;
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
      },
      {
        name: "Fisika",
        icon: Atom,
        tone: "bg-gradient-to-br from-brand-green/15 to-brand-green/5 text-brand-green ring-1 ring-inset ring-brand-green/20",
        desc: "Mekanika, listrik, gelombang, dan fenomena alam.",
      },
      {
        name: "Kimia",
        icon: FlaskConical,
        tone: "bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 ring-1 ring-inset ring-amber-500/20",
        desc: "Struktur materi, reaksi, dan praktikum laboratorium.",
      },
      {
        name: "Biologi",
        icon: Dna,
        tone: "bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 ring-1 ring-inset ring-emerald-500/20",
        desc: "Sel, genetika, ekosistem, dan praktikum hayati.",
      },
      {
        name: "Informatika",
        icon: Code2,
        tone: "bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 text-cyan-700 ring-1 ring-inset ring-cyan-500/20",
        desc: "Algoritma, pemrograman, dan literasi digital.",
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
      },
      {
        name: "Geografi",
        icon: Globe2,
        tone: "bg-gradient-to-br from-sky-500/15 to-sky-500/5 text-sky-600 ring-1 ring-inset ring-sky-500/20",
        desc: "Bumi, iklim, pemetaan, dan lingkungan.",
      },
      {
        name: "Sosiologi",
        icon: Users,
        tone: "bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-rose-600 ring-1 ring-inset ring-rose-500/20",
        desc: "Masyarakat, interaksi sosial, dan perubahan sosial.",
      },
      {
        name: "Sejarah",
        icon: Landmark,
        tone: "bg-gradient-to-br from-brand-green/15 to-brand-green/5 text-brand-green ring-1 ring-inset ring-brand-green/20",
        desc: "Peristiwa dunia & Indonesia serta analisis sumber.",
      },
      {
        name: "PKn",
        icon: Scale,
        tone: "bg-gradient-to-br from-teal-500/15 to-teal-500/5 text-teal-700 ring-1 ring-inset ring-teal-500/20",
        desc: "Pancasila, konstitusi, dan kewarganegaraan.",
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
      },
      {
        name: "Bahasa Inggris",
        icon: Languages,
        tone: "bg-gradient-to-br from-sky-500/15 to-sky-500/5 text-sky-600 ring-1 ring-inset ring-sky-500/20",
        desc: "Komunikasi global dan apresiasi sastra.",
      },
      {
        name: "Bahasa Jepang",
        icon: BookType,
        tone: "bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-rose-600 ring-1 ring-inset ring-rose-500/20",
        desc: "Bahasa dan budaya Jepang tingkat dasar–menengah.",
      },
      {
        name: "Sastra Indonesia",
        icon: PenLine,
        tone: "bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 ring-1 ring-inset ring-amber-500/20",
        desc: "Puisi, prosa, drama, dan kritik sastra.",
      },
      {
        name: "Antropologi",
        icon: Compass,
        tone: "bg-gradient-to-br from-teal-500/15 to-teal-500/5 text-teal-700 ring-1 ring-inset ring-teal-500/20",
        desc: "Budaya, tradisi, dan kehidupan masyarakat.",
      },
    ],
  },
];
