import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import SectionHeader from "@/components/ui/SectionHeader";
import { getNews } from "@/lib/content-server";

export default async function NewsSection() {
  const news = (await getNews()).slice(0, 3);
  const articles = news.map((article) => ({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    authorName: article.author,
    category: article.category,
    publishedAt: article.publishedAt,
    coverImage: article.cover,
    views: article.views,
  }));
  return (
    <section className="section-padding bg-white" aria-label="Berita">
      <div className="container-custom">
        <SectionHeader
          title={
            <>
              Berita dan Kegiatan <span className="text-brand-leaf">Terbaru</span>
            </>
          }
          action={
            <Link
              href="/berita"
              className="text-sm font-semibold text-brand-green hover:text-brand-pine flex items-center gap-1 transition-colors"
            >
              Semua Berita <ChevronRight size={15} />
            </Link>
          }
          className="mb-8"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {articles.length === 0 ? (
            <p className="text-sm text-muted sm:col-span-2 lg:col-span-3">
              Belum ada berita yang dipublikasikan.
            </p>
          ) : (
            articles.map((article) => (
            <Link
              key={article.id}
              href={`/berita?berita=${article.slug}`}
              className="group relative block aspect-[4/3] rounded-xl overflow-hidden bg-brand-pine"
            >
              <Image
                src={article.coverImage ?? "/assets/hero-1.png"}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-brand-pine/95 via-brand-pine/45 to-brand-pine/10" />

              <span className="absolute inset-x-0 bottom-0 p-5">
                <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-lime mb-2">
                  {article.category}
                </span>
                <span className="block font-display font-bold text-white text-base md:text-lg leading-snug line-clamp-3 group-hover:underline decoration-brand-lime/60 decoration-2 underline-offset-4">
                  {article.title}
                </span>
                <span className="mt-3 flex items-center gap-3 text-[11px] text-white/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={11} aria-hidden="true" />
                    {formatDate(article.publishedAt)}
                  </span>
                  <span>{article.views.toLocaleString("id-ID")} pembaca</span>
                </span>
              </span>
            </Link>
          ))
          )}
        </div>
      </div>
    </section>
  );
}
