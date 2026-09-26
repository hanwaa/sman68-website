import type { MetadataRoute } from "next";
import { dbConfigured, getDb } from "@/lib/db";
import { siteBase } from "@/lib/seo";

/**
 * Sitemap di-prerender saat build (force-static) dan disajikan Next langsung
 * dari berkas statis — tanpa runtime Node dan tanpa query DB saat request.
 * Ini yang membuat Googlebot tidak pernah Dependent dari kondisi server: GSC
 * sempat mencatat "Pengambilan halaman: Gagal — Error server (5xx)" saat
 * sitemap masih dirender on-demand.
 *
 * Konsekuensi: artikel yang baru terbit belum masuk sitemap sampai deploy
 * berikutnya (artikelnya tetap terindeks lewat link internal & Peta Situs
 * Google News).
 */
export const dynamic = "force-static";

/**
 * Hanya <loc> dan <lastmod> yang dipakai. Google mengabaikan <changefreq> dan
 * <priority>, jadi keduanya dihilangkan agar sitemap sesederhana mungkin.
 *
 * lastmod memakai format tanggal saja (YYYY-MM-DD) sesuai contoh minimal
 * sitemap.org. Rute statis sengaja tanpa lastmod: kalau diisi `now`, setiap
 * sitemap yang di-regenerate menandai semua halaman berubah dan Google
 * encouraged untuk recrawl semuanya tanpa alasan.
 */
const staticRoutes: string[] = [
  "",
  "/berita",
  "/prestasi",
  "/ppdb",
  "/ppdb/biaya",
  "/ppdb/faq",
  "/akademik/program",
  "/kehidupan/ekskul",
  "/kehidupan/galeri",
  "/komunitas/alumni",
  "/tentang/profil",
  "/tentang/visi-misi",
  "/tentang/kepala-sekolah",
  "/tentang/struktur",
  "/tentang/fasilitas",
  "/kebijakan-privasi",
  "/aksesibilitas",
];

const dateOnly = (value: Date): string => value.toISOString().slice(0, 10);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteBase();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({ url: base + path }));

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
          ...(row.published_at ? { lastModified: dateOnly(new Date(String(row.published_at))) } : {}),
        });
      }
    }
  } catch {
    // DB tidak tersedia saat build — sitemap statis tetap terbit.
  }

  return entries;
}
