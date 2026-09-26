import type { MetadataRoute } from "next";
import { dbConfigured, getDb } from "@/lib/db";
import { siteBase } from "@/lib/seo";

export const revalidate = 3600;

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

const staticRoutes: Array<{
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
}> = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/berita", priority: 0.9, changeFrequency: "weekly" },
  { path: "/prestasi", priority: 0.8, changeFrequency: "weekly" },
  { path: "/ppdb", priority: 0.9, changeFrequency: "monthly" },
  { path: "/ppdb/biaya", priority: 0.7, changeFrequency: "monthly" },
  { path: "/ppdb/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/akademik/program", priority: 0.8, changeFrequency: "monthly" },
  { path: "/kehidupan/ekskul", priority: 0.7, changeFrequency: "monthly" },
  { path: "/kehidupan/galeri", priority: 0.7, changeFrequency: "weekly" },
  { path: "/komunitas/alumni", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tentang/profil", priority: 0.8, changeFrequency: "monthly" },
  { path: "/tentang/visi-misi", priority: 0.7, changeFrequency: "monthly" },
  { path: "/tentang/sejarah", priority: 0.6, changeFrequency: "yearly" },
  { path: "/tentang/kepala-sekolah", priority: 0.6, changeFrequency: "yearly" },
  { path: "/tentang/guru-staf", priority: 0.6, changeFrequency: "monthly" },
  { path: "/tentang/fasilitas", priority: 0.8, changeFrequency: "monthly" },
  { path: "/kebijakan-privasi", priority: 0.3, changeFrequency: "yearly" },
  { path: "/aksesibilitas", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBase();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: base + route.path,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    if (dbConfigured()) {
      const sql = getDb();
      const rows = await sql`
        select slug, published_at
        from news
        where status = 'published'
        order by published_at desc
      `;
      for (const row of rows) {
        const slug = String(row.slug ?? "").trim();
        if (!slug) continue;
        entries.push({
          url: `${base}/berita/${slug}`,
          lastModified: row.published_at ? new Date(String(row.published_at)) : now,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // DB tidak tersedia saat build — sitemap statis tetap terbit.
  }

  return entries;
}
