import "server-only";

import { DEFAULT_CHIPS, FALLBACK_ANSWER, GREETING } from "@/lib/chat-copy";
import { getAchievements, getEkskul, getFaqs, getNews } from "@/lib/content-server";
import { buildFacilityAnswer } from "@/lib/school-facilities";
import { schoolData } from "@/lib/school-data";
import {
  extractRelevant,
  isAboutSchool,
  isOfficialSource,
  keywordCoverage,
  tinyfishConfigured,
  webFetchText,
  webSearch,
} from "@/lib/tinyfish";

export type KnowledgeLink = { label: string; href: string };

export type KnowledgeItem = {
  id: string;
  category: string;
  question: string;
  keywords: string[];
  answer: string;
  link?: KnowledgeLink;
  chips?: string[];
  volatile?: boolean;
  webQuery?: string;
  /** Data internal sekolah — jangan ditimpa info web yang bisa bertentangan. */
  noWeb?: boolean;
};

export type ChatAnswer = {
  answer: string;
  link?: KnowledgeLink;
  sources?: KnowledgeLink[];
  chips: string[];
  intent: string;
};

const identitas = schoolData.identitas;
const kontak = schoolData.kontak;
const siswa = schoolData.siswa;
const ptk = schoolData.ptk;
const sarana = schoolData.sarana;
const intake = schoolData.intakePpdb;

const GREETING_WORDS = ["halo", "hai", "hello", "hei", "pagi", "siang", "sore", "malam", "permisi"];

const THANKS_WORDS = ["terima kasih", "makasih", "thanks", "membantu"];

const STOPWORDS = new Set([
  "yang",
  "dan",
  "atau",
  "untuk",
  "dengan",
  "dari",
  "pada",
  "adalah",
  "apa",
  "apakah",
  "ini",
  "itu",
  "saya",
  "anda",
  "kamu",
  "kak",
  "bang",
  "tolong",
  "mohon",
  "dong",
  "minta",
  "tanya",
  "mau",
  "ingin",
  "gimana",
  "bagaimana",
  "berapa",
  "kapan",
  "siapa",
  "kenapa",
  "mengapa",
  "dimana",
  "apakah",
  "kah",
  "sih",
  "ya",
  "di",
  "ke",
  "serta",
  "saja",
  "tersedia",
  "ada",
  "banyak",
  "besar",
  "mana",
  "sudah",
  "juga",
  "lagi",
  "hanya",
  "sekolah",
  "sman",
  "jakarta",
]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function containsAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function isSchoolSite(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "").endsWith(SCHOOL_SITE);
  } catch {
    return false;
  }
}

const joinList = (values: string[]) =>
  new Intl.ListFormat("id-ID", { style: "long", type: "conjunction" }).format(values);

function staticItems(): KnowledgeItem[] {
  return [
    {
      id: "ppdb",
      category: "PPDB",
      question: "Info PPDB",
      keywords: [
        "ppdb",
        "pendaftaran",
        "peserta didik baru",
        "mendaftar",
        "cara masuk",
        "tahun ajaran",
        "penerimaan siswa",
      ],
      answer: `Pendaftaran PPDB SMAN 68 Jakarta dilakukan online melalui portal resmi DKI Jakarta di ppdb.jakarta.go.id, bukan secara langsung di sekolah. Tersedia jalur Zonasi, Afirmasi, Prestasi, dan Perpindahan Tugas. Estimasi intakes ${intake.rombel} rombel x ${intake.perKelas} siswa = ${intake.estimasiSiswa} siswa baru.`,
      link: { label: "Buka halaman PPDB", href: "/ppdb" },
      chips: ["Jalur PPDB", "Jadwal PPDB", "Syarat pendaftaran", "Biaya sekolah"],
      volatile: true,
      webQuery: "PPDB SMA DKI Jakarta jalur pendaftaran dan kuota",
    },
    {
      id: "ppdb-jalur",
      category: "PPDB",
      question: "Jalur PPDB",
      keywords: ["jalur", "zonasi", "afirmasi", "perpindahan tugas", "domisili", "kuota"],
      answer:
        "Empat jalur PPDB: Zonasi (berdasarkan domisili), Afirmasi (siswa dengan background{dfield terdata), Prestasi (berdasarkan nilai rapor dan capaian lomba), serta Perpindahan Tugas (pindah dari sekolah lain). Rincian kuota tiap jalur ada di halaman PPDB.",
      link: { label: "Detail jalur PPDB", href: "/ppdb" },
    },
    {
      id: "ppdb-jadwal",
      category: "PPDB",
      question: "Jadwal PPDB",
      keywords: ["jadwal", "tanggal", "alur", "tahapan", "daftar ulang", "pengumuman"],
      answer:
        "Jadwal PPDB mengikuti kalender resmi PPDB DKI Jakarta dan diumumkan di portal ppdb.jakarta.go.id. Tahapannya: pendaftaran per jalur, pengumuman hasil, verifikasi berkas, lalu daftar ulang. Tanggal terbaru selalu ada di portal PPDB.",
      link: { label: "Lihat alur dan jadwal", href: "/ppdb" },
      volatile: true,
      webQuery: "jadwal PPDB SMA DKI Jakarta terbaru",
    },
    {
      id: "ppdb-syarat",
      category: "PPDB",
      question: "Syarat pendaftaran",
      keywords: [
        "syarat",
        "persyaratan",
        "dokumen",
        "berkas",
        "akta",
        "kartu keluarga",
        "rapor",
        "pas foto",
      ],
      answer:
        "Dokumen umumnya: akta kelahiran, KTP dan kartu keluarga, pas foto, rapor atau surat keterangan kelas terakhir, serta dokumen pendukung sesuai jalur pendaftaran. Daftar berkas final mengikuti ketentuan portal PPDB DKI Jakarta.",
      link: { label: "Baca FAQ PPDB", href: "/ppdb/faq" },
    },
    {
      id: "biaya",
      category: "PPDB",
      question: "Biaya sekolah",
      keywords: ["biaya", "spp", "uang sekolah", "bebas biaya", "gratis", "iuran", "biaya pendidikan"],
      answer:
        "SMAN 68 adalah sekolah negeri: tidak ada biaya pendaftaran dan tidak ada SPP bulanan. Rincian kebutuhan yang tetap disiapkan, seperti seragam, alat tulis, buku, dan biaya kegiatan, dijelaskan di halaman Biaya dan Beasiswa.",
      link: { label: "Rincian biaya dan beasiswa", href: "/ppdb/biaya" },
      chips: ["Jalur beasiswa", "Syarat pendaftaran", "Info PPDB"],
    },
    {
      id: "beasiswa",
      category: "PPDB",
      question: "Jalur beasiswa",
      keywords: ["beasiswa", "bantuan", "subsidi", "kip", "bantuan sosial", "kurang mampu"],
      answer:
        "Tersedia jalur afirmasi untuk siswa yang tercatat dan memenuhi syarat bantuan sosial, serta program beasiswa dari pemda. Syarat dan kuota mengikuti ketentuan PPDB DKI Jakarta dan umumnya diverifikasi saat daftar ulang.",
      link: { label: "Info beasiswa", href: "/ppdb/biaya" },
      volatile: true,
      webQuery: "beasiswa SMA DKI Jakarta",
    },
    {
      id: "jam-pelajaran",
      category: "Akademik",
      question: "Jam pelajaran",
      keywords: [
        "jam",
        "jadwal pelajaran",
        "masuk",
        "pulang",
        "absen",
        "absensi",
        "senin",
        "jumat",
        "waktu",
        "jam kerja",
      ],
      answer:
        "Hari belajar Senin sampai Jumat, pukul 07.00 sampai 15.30 WIB dengan sistem JamFlex. Rincian jadwal setiap mata pelajaran dibagikan wali kelas melalui portal sekolah.",
      link: { label: "Lihat program studi", href: "/akademik/program" },
      noWeb: true,
    },
    {
      id: "kelas-digital",
      category: "Akademik",
      question: "Kelas digital",
      keywords: [
        "kelas digital",
        "dashboard",
        "portal",
        "login",
        "akun",
        "e learning",
        "tugas",
        "nilai",
        "absensi digital",
        "kelas",
      ],
      answer:
        "Kelas Digital adalah portal belajar siswa untuk absensi, tugas, pengumuman, dan nilai. Akun diberikan Tata Usaha atau wali kelas. Hubungi TU di " +
        kontak.telepon +
        " bila belum punya akun.",
      link: { label: "Masuk ke portal", href: "/login" },
      noWeb: true,
    },
    {
      id: "kontak",
      category: "Kontak",
      question: "Kontak sekolah",
      keywords: [
        "kontak",
        "telepon",
        "telp",
        "telpon",
        "hp",
        "nomor",
        "email",
        "surel",
        "hubungi",
        "tata usaha",
      ],
      answer: `Tata usaha: ${kontak.telepon}\nEmail: ${kontak.email}\nAlamat: ${kontak.alamat}\nJam layanan: Senin sampai Jumat, 07.00 sampai 15.30 WIB.`,
      link: { label: "Lihat peta lokasi", href: kontak.mapsUrl },
      noWeb: true,
    },
    {
      id: "alamat",
      category: "Kontak",
      question: "Alamat sekolah",
      keywords: ["alamat", "lokasi", "letak", "maps", "peta", "di mana", "datang"],
      answer: `Alamat: ${kontak.alamat}\nDaerah ${kontak.kecamatan}, ${kontak.kota} ${kontak.kodePos}.`,
      link: { label: "Buka Google Maps", href: kontak.mapsUrl },
    },
    {
      id: "profil",
      category: "Profil",
      question: "Profil sekolah",
      keywords: [
        "profil",
        "identitas",
        "npsn",
        "akreditasi",
        "berdiri",
        "sejarah",
        "kurikulum",
        "rombel",
        "jumlah siswa",
      ],
      answer: `SMA Negeri 68 Jakarta dengan NPSN ${identitas.npsn}, sekolah negeri akreditasi ${identitas.akreditasi} skor ${identitas.skorAkreditasi} yang berlaku sampai ${identitas.akreditasiBerlakuSampai}. Berdiri sejak ${identitas.tahunBerdiri} dan memakai ${identitas.kurikulum}. Saat ini ada ${siswa.total} siswa dalam ${siswa.rombel} rombel dengan ${ptk.guru} guru.`,
      link: { label: "Baca profil lengkap", href: "/tentang/profil" },
      noWeb: true,
    },
    {
      id: "fasilitas",
      category: "Profil",
      question: "Fasilitas sekolah",
      keywords: [
        "fasilitas",
        "lab",
        "laboratorium",
        "perpustakaan",
        "lapangan",
        "ruang",
        "gedung",
        "internet",
        "wifi",
        "komputer",
      ],
      answer: `Fasilitas: ${sarana.ruangKelas} ruang kelas dengan ${sarana.ruangKelasLayak} persen layak, laboratorium IPA, Fisika, Kimia, Biologi, Bahasa, IPS, dan Komputer, serta perpustakaan. Internet ${sarana.internet} dengan listrik ${sarana.dayaListrikVA.toLocaleString("id-ID")} VA.`,
      link: { label: "Lihat fasilitas", href: "/tentang/fasilitas" },
      noWeb: true,
    },
    {
      id: "guru",
      category: "Profil",
      question: "Guru dan kepala sekolah",
      keywords: ["guru", "staf", "kepsek", "kepala sekolah", "pengajar", "tenaga pendidik"],
      answer: `SMAN 68 punya ${ptk.guru} guru, dengan ${ptk.persenASN} persen berstatus ASN dan ${ptk.persenSertifikasi} persen sudah bersertifikasi. Daftar nama lengkap guru dan staf tersedia di dashboard siswa, karena data indoors bersifat internal sekolah.`,
      noWeb: true,
    },
    {
      id: "alumni",
      category: "Komunitas",
      question: "Alumni dan komunitas",
      keywords: ["alumni", "komunitas", "jaringan", "karier", "lowongan", "jejaring"],
      answer:
        "Alumni SMAN 68 terhubung lewat jaringan karier dan program mentoring. Buka direktori alumni untuk melihat cerita mereka dan cara bergabung dengan komunitas sekolah.",
      link: { label: "Buka halaman alumni", href: "/komunitas/alumni" },
    },
    {
      id: "bantuan",
      category: "Umum",
      question: "Apa saja yang bisa ditanyakan?",
      keywords: ["bantuan", "menu", "topik", "mampu", "bisa apa", "fungsi", "contoh", "rekomendasi"],
      answer:
        "Saya bisa membantu PPDB (jalur, jadwal, syarat, biaya, beasiswa), jam pelajaran, kelas digital, fasilitas, ekstrakurikuler, prestasi, berita terbaru, dan kontak sekolah. Ada yang ingin ditanyakan?",
      chips: DEFAULT_CHIPS,
    },
  ];
}

async function buildDynamicItems(): Promise<KnowledgeItem[]> {
  const items: KnowledgeItem[] = [];

  const faqs = await getFaqs();
  const ppdbPattern = /ppdb|pendaftaran|jalur|zonasi|afirmasi|daftar ulang|spmb/;
  for (const faq of faqs) {
    const aboutPpdb =
      faq.category.toLowerCase() === "ppdb" ||
      ppdbPattern.test(`${faq.question} ${faq.answer}`.toLowerCase());
    items.push({
      id: `faq-${faq.id}`,
      category: faq.category || "Umum",
      question: faq.question,
      keywords: Array.from(
        new Set([faq.category, ...tokenize(faq.question)].filter((word) => word.length > 2))
      ),
      answer: faq.answer,
      link: aboutPpdb ? { label: "Buka FAQ PPDB", href: "/ppdb/faq" } : undefined,
      volatile: aboutPpdb,
      webQuery: faq.question,
    });
  }

  const news = await getNews();
  if (news.length > 0) {
    items.push({
      id: "berita",
      category: "Berita",
      question: "Berita terbaru",
      keywords: ["berita", "kabar", "pengumuman", "kegiatan", "artikel", "terbaru"],
      answer: `Berita terbaru: ${joinList(news.slice(0, 3).map((article) => article.title))}.`,
      link: { label: "Semua berita", href: "/berita" },
    });
  }

  const achievements = await getAchievements();
  if (achievements.length > 0) {
    items.push({
      id: "prestasi",
      category: "Prestasi",
      question: "Prestasi terbaru",
      keywords: [
        "prestasi",
        "juara",
        "medali",
        "juara 1",
        "juara 2",
        "juara 3",
        "nasional",
        "provinsi",
        "penghargaan",
        "olimpiade",
      ],
      answer: `Prestasi terbaru: ${joinList(
        achievements.slice(0, 3).map((item) => `${item.title} (${item.level}, ${item.year})`)
      )}.`,
      link: { label: "Semua prestasi", href: "/prestasi" },
    });
  }

  const ekskul = await getEkskul();
  if (ekskul.length > 0) {
    const shown = ekskul.slice(0, 10).map((item) => item.name);
    const rest = ekskul.length - shown.length;
    items.push({
      id: "ekskul",
      category: "Kehidupan",
      question: "Ekstrakurikuler",
      keywords: ["ekskul", "ekstrakurikuler", "eskul", "kegiatan", "klub", "peminatan"],
      answer: `Ada ${ekskul.length} ekstrakurikuler, antara lain ${joinList(shown)}${
        rest > 0 ? `, dan ${rest} lainnya` : ""
      }. Groupsnya mencakup olahraga, seni, teknologi, dan literasi. Jadwal serta pembinanya ada di halaman ekskul.`,
      link: { label: "Daftar ekskul", href: "/kehidupan/ekskul" },
      noWeb: true,
    });
  }

  items.push({
    id: "galeri",
    category: "Kehidupan",
    question: "Galeri kegiatan",
    keywords: ["galeri", "foto", "dokumentasi", "gambar", "album", "video"],
    answer:
      "Galeri berisi dokumentasi kegiatan sekolah seperti pembelajaran, lomba, dan acara sekolah. Buka galeri untuk melihat foto kegiatan siswa terbaru.",
    link: { label: "Buka galeri", href: "/kehidupan/galeri" },
  });

  return items;
}

let cache: { at: number; items: KnowledgeItem[] } | null = null;
const CACHE_TTL = 60_000;

async function getKnowledge(): Promise<KnowledgeItem[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.items;
  const items = [...staticItems(), ...(await buildDynamicItems())];
  cache = { at: Date.now(), items };
  return items;
}

function scoreItem(message: string, item: KnowledgeItem): number {
  let score = 0;
  let matched = 0;

  for (const keyword of item.keywords) {
    const normalizedKeyword = normalize(keyword);
    if (normalizedKeyword.length < 3) continue;
    if (message.includes(normalizedKeyword)) {
      matched += 1;
      score += 2 + normalizedKeyword.split(" ").length;
    }
  }

  const questionTokens = new Set(tokenize(item.question));
  for (const token of tokenize(message)) {
    if (questionTokens.has(token)) score += 1.25;
  }

  if (matched > 0) score += matched * 0.5;
  const normalizedQuestion = normalize(item.question);
  if (normalizedQuestion.length > 3 && message.includes(normalizedQuestion)) score += 3;
  return score;
}

function findBest(message: string, items: KnowledgeItem[]) {
  let best: KnowledgeItem | null = null;
  let bestScore = 0;
  for (const item of items) {
    const score = scoreItem(message, item);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return bestScore >= 3 && best ? { item: best, score: bestScore } : null;
}

/** Berapa banyak isi pertanyaan pengguna yang benar-benar tercakup oleh item. */
function coverage(message: string, item: KnowledgeItem): number {
  const messageTokens = tokenize(message);
  if (messageTokens.length === 0) return 1;

  const pool = [
    ...item.keywords.map((keyword) => normalize(keyword)),
    normalize(item.question),
    ...tokenize(item.question),
  ];
  const hits = messageTokens.filter((token) =>
    pool.some((entry) => entry.includes(token))
  ).length;
  return hits / messageTokens.length;
}

const FRESHNESS_WORDS = [
  "terbaru",
  "terupdate",
  "update",
  "sekarang",
  "tahun ini",
  "2026",
  "2027",
  "masih",
  "terakhir",
  "berubah",
  "terjadi",
  "sudah",
  "kapan",
];

const SCHOOL_NAME_PATTERN = /sman\s?68|sma negeri 68|sman68/;
const SITE_OPERATOR = /(?:^|\s)-?site:[^\s]+/g;
const OFFICIAL_TOPIC_PATTERN =
  /ppdb|pendaftaran|spmb|zonasi|afirmasi|jalur|kuota|beasiswa|akreditasi/;

export const SCHOOL_SITE = "sman68-jkt.my.id";

/** Tambahkan nama sekolah, tapi pertahankan operator site: yang ditulis pengguna. */
function buildWebQuery(message: string): string {
  const operators = message.match(SITE_OPERATOR) ?? [];
  const plain = message.replace(SITE_OPERATOR, " ").replace(/\s+/g, " ").trim();
  const scoped = SCHOOL_NAME_PATTERN.test(plain)
    ? plain
    : `SMA Negeri 68 Jakarta ${plain}`.trim();
  return [...scoped.split(" "), ...operators].join(" ").trim();
}

async function searchSchoolSite(query: string) {
  if (SITE_OPERATOR.test(query)) {
    SITE_OPERATOR.lastIndex = 0;
    return [];
  }
  SITE_OPERATOR.lastIndex = 0;
  const stripped = query.replace(SITE_OPERATOR, " ").replace(/\s+/g, " ").trim();
  if (!stripped) return [];
  return webSearch(stripped, { limit: 6, pages: 2, site: SCHOOL_SITE });
}

async function answerFromWeb(rawQuery: string, withFetch: boolean) {
  const query = buildWebQuery(rawQuery);
  const officialTopic = OFFICIAL_TOPIC_PATTERN.test(query);
  const hasSiteOperator = /site:[^\s]+/.test(query);
  const webPages = hasSiteOperator ? 3 : 2;

  const [siteResults, webResults] = await Promise.all([
    searchSchoolSite(query).catch(() => []),
    webSearch(query, { limit: 12, pages: webPages }).catch(() => []),
  ]);

  const merged = [...siteResults, ...webResults];
  const seen = new Set<string>();
  const relevant = merged.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return isAboutSchool(item, officialTopic);
  });
  if (relevant.length === 0) return null;

  const keywords = tokenize(rawQuery).filter((word) => word.length > 3).slice(0, 4);
  if (officialTopic) keywords.push("spmb", "pendaftaran");

  const ranked = relevant
    .map((item) => ({
      item,
      coverage: keywordCoverage(`${item.title} ${item.snippet}`, keywords),
    }))
    .filter(
      ({ item, coverage }) => coverage >= 0.34 || (officialTopic && isOfficialSource(item.url))
    )
    .sort((a, b) => {
      // Halaman milik sekolah sendiri selalu didahulukan.
      const aOwn = isSchoolSite(a.item.url) ? 0 : 1;
      const bOwn = isSchoolSite(b.item.url) ? 0 : 1;
      if (aOwn !== bOwn) return aOwn - bOwn;
      if (a.item.snippet && !b.item.snippet) return -1;
      if (!a.item.snippet && b.item.snippet) return 1;
      return b.coverage - a.coverage;
    });

  let chosen = ranked.find(({ item }) => item.snippet)?.item ?? ranked[0]?.item;
  if (!chosen) return null;

  let lead = chosen.snippet;
  if (withFetch && (!lead || lead.length < 80)) {
    const pageText = await webFetchText(chosen.url);
    if (pageText) lead = extractRelevant(pageText, rawQuery) || lead;
  }

  if (!lead) {
    const withText = ranked.find(({ item }) => item.snippet);
    if (!withText) return null;
    chosen = withText.item;
    lead = withText.item.snippet;
  }

  const extra = ranked
    .map(({ item }) => item)
    .find((item) => item.url !== chosen.url && item.snippet);
  const body = `${lead}${extra ? `\n\n${extra.snippet}` : ""}`.slice(0, 700);

  return {
    answer: `Info dari web:\n${body}`,
    sources: ranked
      .slice(0, 3)
      .map(({ item }) => ({ label: item.title, href: item.url }))
      .filter((source) => Boolean(source.label)),
  };
}

export async function answerQuestion(rawMessage: string): Promise<ChatAnswer> {
  const message = normalize(rawMessage);
  if (!message) {
    return { answer: GREETING, chips: DEFAULT_CHIPS, intent: "empty" };
  }

  if (containsAny(message, THANKS_WORDS)) {
    return {
      answer: "Sama-sama! Kalau ada pertanyaan lain tentang SMAN 68, saya siap membantu.",
      chips: ["Kontak sekolah", "Info PPDB", "Prestasi terbaru"],
      intent: "terima-kasih",
    };
  }

  // Fasilitas & ruang kelas: jawaban langsung dari data sekolah, bukan dari web.
  const facilityAnswer = await buildFacilityAnswer(rawMessage);
  if (facilityAnswer) {
    return {
      answer: facilityAnswer,
      link: { label: "Lihat semua fasilitas", href: "/tentang/fasilitas" },
      chips: ["Fasilitas lantai 1", "Fasilitas lantai 5", "Ekstrakurikuler", "Kontak sekolah"],      intent: "fasilitas",
    };
  }

  const match = findBest(message, await getKnowledge());
  const webEnabled = tinyfishConfigured();
  const wantsFresh = containsAny(message, FRESHNESS_WORDS);
  const related = match ? coverage(message, match.item) >= 0.6 : false;

  const webAnswer = async (query: string, withFetch: boolean) =>
    webEnabled ? answerFromWeb(query, withFetch) : null;

  if (match && (!match.item.volatile || related)) {
    const base: ChatAnswer = {
      answer: match.item.answer,
      link: match.item.link,
      chips: match.item.chips ?? DEFAULT_CHIPS,
      intent: match.item.id,
    };

    const canEnrich = webEnabled && !match.item.noWeb && (match.item.volatile || wantsFresh);
    if (!canEnrich) return base;

    const useItemQuery = match.item.volatile && match.score >= 6;
    const web = await webAnswer(
      useItemQuery ? match.item.webQuery ?? message : buildWebQuery(message),
      wantsFresh && !useItemQuery
    );
    if (!web) return base;

    return {
      ...base,
      answer: `${base.answer}\n\n${web.answer}`,
      sources: web.sources,
      intent: `${base.intent}+web`,
    };
  }

  if (message.split(" ").length <= 3 && containsAny(message, GREETING_WORDS)) {
    return { answer: GREETING, chips: DEFAULT_CHIPS, intent: "sapaan" };
  }

  const web = await webAnswer(buildWebQuery(message), true);
  if (web) {
    return { ...web, chips: ["Info PPDB", "Biaya sekolah", "Kontak sekolah"], intent: "web" };
  }

  if (match) {
    return {
      answer: match.item.answer,
      link: match.item.link,
      chips: match.item.chips ?? DEFAULT_CHIPS,
      intent: match.item.id,
    };
  }

  return { answer: FALLBACK_ANSWER, chips: DEFAULT_CHIPS, intent: "fallback" };
}
