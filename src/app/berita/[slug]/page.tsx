import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Eye, Tag, User } from "lucide-react";
import JsonLd from "@/components/seo/JsonLd";
import { getNewsBySlug, getNewsSlugs } from "@/lib/content-server";
import { articleSchema, breadcrumbSchema } from "@/lib/schema";
import { SITE_NAME, buildMetadata, ogCardUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getNewsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) {
    return { title: "Artikel tidak ditemukan", robots: { index: false, follow: false } };
  }
  const description = (article.excerpt?.trim() || article.content.split("\n\n")[0] || "").slice(0, 155);
  return buildMetadata({
    title: article.title,
    description,
    path: `/berita/${article.slug}`,
    type: "article",
    image: ogCardUrl({
      title: article.title,
      category: article.category,
      label: "Berita Sekolah",
      image: article.cover || null,
    }),
    publishedTime: article.publishedAt || undefined,
    authors: article.author ? [article.author] : [SITE_NAME],
  });
}

function ContentBlocks({ content }: { content: string }) {
  return (
    <>
      {content.split("\n\n").map((block, i) => {
        const lines = block.split("\n");
        const paragraphs = lines.filter((l) => !l.startsWith("- "));
        const items = lines.filter((l) => l.startsWith("- "));
        return (
          <div key={i} className="space-y-3">
            {paragraphs.map((line, j) => (
              <p key={j}>{line}</p>
            ))}
            {items.length > 0 && (
              <ul className="list-disc pl-5 space-y-1.5">
                {items.map((line, j) => (
                  <li key={j}>{line.replace(/^- /, "")}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </>
  );
}

export default async function BeritaDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);

  if (!article) {
    notFound();
  }

  const catColors: Record<string, string> = {
    Prestasi: "bg-brand-green/10 text-brand-green",
    Pengumuman: "bg-brand-pine/10 text-brand-pine",
    Kegiatan: "bg-brand-green/10 text-brand-green",
    Akademik: "bg-brand-green/10 text-brand-green",
  };

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem] min-h-screen bg-cream">
        <div className="container-custom max-w-3xl py-10">
          <JsonLd
            data={[
              articleSchema(article),
              breadcrumbSchema([
                { name: "Beranda", path: "/" },
                { name: "Berita", path: "/berita" },
                { name: article.title, path: `/berita/${article.slug}` },
              ]),
            ]}
          />

          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-brand-green transition-colors">Beranda</Link>
              </li>
              <li aria-hidden="true" className="text-line">/</li>
              <li>
                <Link href="/berita" className="hover:text-brand-green transition-colors">Berita</Link>
              </li>
              <li aria-hidden="true" className="text-line">/</li>
              <li aria-current="page" className="text-ink/70 max-w-[16rem] truncate">{article.title}</li>
            </ol>
          </nav>

          <article>
            <div className="relative aspect-video overflow-hidden rounded-2xl shadow-card">
              <Image
                src={article.cover}
                alt={article.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width:768px) 100vw, 800px"
              />
              <span className={`badge absolute left-4 top-4 shadow-sm ${catColors[article.category] || "bg-line text-muted"}`}>
                <Tag size={10} aria-hidden="true" /> {article.category}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line pb-5 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <User size={12} aria-hidden="true" />
                {article.author}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} aria-hidden="true" />
                <time dateTime={article.publishedAt} className="tabular-nums">
                  {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(article.publishedAt))}
                </time>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye size={12} aria-hidden="true" />
                {article.views.toLocaleString("id-ID")} pembaca
              </span>
            </div>

            <h1 className="mt-5 font-display text-2xl font-extrabold leading-tight text-ink md:text-3xl">
              {article.title}
            </h1>

            {article.excerpt?.trim() && (
              <p className="mt-3 text-base leading-relaxed text-muted md:text-lg">
                {article.excerpt}
              </p>
            )}

            <div className="card mt-6 p-6 md:p-9">
              <div className="space-y-4 text-sm leading-relaxed text-ink md:text-base">
                <ContentBlocks content={article.content} />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
              <Link href="/berita" className="btn-ghost text-sm">
                <ArrowLeft size={15} aria-hidden="true" /> Semua Berita
              </Link>
              <Link href="/" className="text-xs font-semibold text-muted transition-colors hover:text-brand-green">
                Kembali ke Beranda
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
