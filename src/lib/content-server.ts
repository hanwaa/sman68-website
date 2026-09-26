import "server-only";

import { dbConfigured, getDb } from "@/lib/db";
import {
  achievements as staticAchievements,
  faqs as staticFaqs,
  galleryAlbums as staticAlbums,
  galleryPhotos as staticPhotos,
  type AchievementContent,
  type GalleryAlbumContent,
  type GalleryPhotoContent,
} from "@/lib/content";
import { ekskulList, type Ekskul } from "@/lib/ekskul";
import type { NewsArticle } from "@/lib/news";

type Row = Record<string, unknown>;
const text = (v: unknown) => (v == null ? "" : String(v));

const relativeLabel = (iso: string | null) => {
  if (!iso) return "";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
};

function mapNews(rows: Row[]): NewsArticle[] {
  return rows.map((row, index) => ({
    id: String(index + 1),
    slug: text(row.slug),
    title: text(row.title),
    excerpt: text(row.excerpt),
    content: text(row.content),
    category: text(row.category) as NewsArticle["category"],
    author: text(row.author),
    cover: text(row.cover_key),
    views: Number(row.views) || 0,
    dateLabel: relativeLabel(row.published_at as string | null),
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : "",
  }));
}

/** Berita dari Neon — tanpa fallback data statis. */
export async function getNews(): Promise<NewsArticle[]> {
  if (!dbConfigured()) return [];
  try {
    const rows = (await getDb()`
      select slug, title, excerpt, content, category, author, cover_key, views, published_at
      from news where status = 'published'
      order by published_at desc
    `) as Row[];
    return mapNews(rows);
  } catch {
    return [];
  }
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle | undefined> {
  const all = await getNews();
  return all.find((article) => article.slug === slug);
}

export async function getNewsSlugs(): Promise<string[]> {
  const all = await getNews();
  return all.map((article) => article.slug);
}

export async function getAchievements(): Promise<AchievementContent[]> {
  if (!dbConfigured()) return staticAchievements;
  try {
    // Left join berita supaya tiap prestasi bisa ditautkan ke artikelnya.
    const rows = (await getDb()`
      select a.id, a.title, a.description, a.level, a.category, a.award_type, a.year,
             a.cover_key, a.participants, a.student_name, a.ekskul_id, a.created_at,
             n.slug as news_slug, n.title as news_title
      from achievements a
      left join news n
        on n.achievement_id = a.id
       and n.status = 'published'
      where a.status = 'published'
      order by a.year desc, a.title asc
    `) as Row[];
    if (rows.length === 0) return staticAchievements;
    return rows.map((row) => ({
      id: text(row.id),
      title: text(row.title),
      description: text(row.description),
      level: text(row.level) as AchievementContent["level"],
      category: text(row.category),
      awardType: text(row.award_type) as AchievementContent["awardType"],
      year: Number(row.year),
      cover: text(row.cover_key),
      participants: Array.isArray(row.participants) ? (row.participants as string[]) : [],
      studentName: row.student_name == null ? null : text(row.student_name),
      ekskulId: row.ekskul_id == null ? null : text(row.ekskul_id),
      createdAt: row.created_at ? new Date(String(row.created_at)).toISOString() : null,
      newsSlug: row.news_slug == null ? null : text(row.news_slug),
      newsTitle: row.news_title == null ? null : text(row.news_title),
    }));
  } catch {
    return staticAchievements;
  }
}

export async function getEkskul(): Promise<Ekskul[]> {
  if (!dbConfigured()) return ekskulList;
  try {
    const rows = (await getDb()`
      select id, name, category, logo_key, thumb_key, members, achievements, description, schedule, advisor
      from extracurriculars
      order by sort asc
    `) as Row[];
    if (rows.length === 0) return ekskulList;
    return rows.map((row) => ({
      id: text(row.id),
      name: text(row.name),
      category: text(row.category) as Ekskul["category"],
      logo: (row.logo_key as string | null) ?? null,
      thumb: (row.thumb_key as string | null) ?? null,
      members: Number(row.members) || 0,
      achievements: Number(row.achievements) || 0,
      desc: text(row.description),
      schedule: text(row.schedule),
      advisor: text(row.advisor),
    }));
  } catch {
    return ekskulList;
  }
}

export type GalleryData = {  albums: GalleryAlbumContent[];
  photos: GalleryPhotoContent[];
};

export async function getGallery(): Promise<GalleryData> {
  const fallback: GalleryData = { albums: staticAlbums, photos: staticPhotos };
  if (!dbConfigured()) return fallback;
  try {
    const [albums, photos] = await Promise.all([
      getDb()`select id, title, category, cover_key from gallery_albums order by sort asc` as Promise<Row[]>,
      getDb()`select album_id, image_key, caption from gallery_photos order by sort asc` as Promise<Row[]>,
    ]);
    if (albums.length === 0 && photos.length === 0) return fallback;
    return {
      albums: albums.map((album) => ({
        id: text(album.id),
        title: text(album.title),
        category: text(album.category),
        cover: text(album.cover_key),
      })),
      photos: photos.map((photo, index) => ({
        id: `photo-${index + 1}`,
        src: text(photo.image_key),
        caption: text(photo.caption),
        albumId: (photo.album_id as string | null) ?? undefined,
      })),
    };
  } catch {
    return fallback;
  }
}

export type FaqItem = { id: string; question: string; answer: string; category: string };

export async function getFaqs(): Promise<FaqItem[]> {
  if (!dbConfigured()) return staticFaqs;
  try {
    const rows = (await getDb()`
      select id, question, answer, category from faqs order by sort asc
    `) as Row[];
    if (rows.length === 0) return staticFaqs;
    return rows.map((row) => ({
      id: text(row.id),
      question: text(row.question),
      answer: text(row.answer),
      category: text(row.category),
    }));
  } catch {
    return staticFaqs;
  }
}
