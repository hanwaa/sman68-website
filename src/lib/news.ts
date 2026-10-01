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

/**
 * Fallback statis berita — sengaja kosong.
 * Berita dummy sudah dihapus; konten berita berasal dari impor portal berita
 * (lihat scripts/import-berita.mjs) yang masuk ke tabel `news` database.
 */
export const newsArticles: NewsArticle[] = [];
