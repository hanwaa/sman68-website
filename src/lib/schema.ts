import { schoolData } from "@/lib/school-data";
import { DEFAULT_OG_IMAGE, SITE_NAME, absoluteUrl, siteBase } from "@/lib/seo";

const SOCIAL_LINKS = [
  "https://www.instagram.com/smanegeri68jakarta/",
  "https://youtube.com/@sman68jakarta",
  "https://facebook.com/sman68jakarta",
];

export function schoolSchema() {
  const { identitas, kontak } = schoolData;
  return {
    "@context": "https://schema.org",
    "@type": "School",
    name: identitas.namaBersih,
    alternateName: identitas.nama,
    url: siteBase(),
    logo: absoluteUrl("/assets/logo.png"),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description:
      "SMA Negeri 68 Jakarta — sekolah negeri terakreditasi A di Senen, Jakarta Pusat, dengan Kurikulum Merdeka dan 26 ekskul aktif.",
    foundingDate: String(identitas.tahunBerdiri),
    slogan: "Disiplin, Kreatif, Prestasi",
    identifier: {
      "@type": "PropertyValue",
      name: "NPSN",
      value: identitas.npsn,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jl. Salemba Raya No. 18, RT 3/RW 6, Senen",
      addressLocality: "Jakarta Pusat",
      addressRegion: "DKI Jakarta",
      postalCode: kontak.kodePos,
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: kontak.koordinat.lat,
      longitude: kontak.koordinat.lng,
    },
    telephone: kontak.telepon,
    email: kontak.email,
    sameAs: SOCIAL_LINKS,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteBase(),
    inLanguage: "id-ID",
    publisher: {
      "@type": "School",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/logo.png"),
      },
    },
  };
}

type ArticleInput = {
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  cover?: string;
  author?: string;
  publishedAt?: string;
  category?: string;
};

export function articleSchema(article: ArticleInput) {
  const url = absoluteUrl(`/berita/${article.slug}`);
  const description =
    article.excerpt?.trim() || article.content.split("\n\n")[0]?.slice(0, 155) || "";
  const image = article.cover?.startsWith("http")
    ? article.cover
    : absoluteUrl(article.cover || DEFAULT_OG_IMAGE);

  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description,
    image: [image],
    datePublished: article.publishedAt || undefined,
    dateModified: article.publishedAt || undefined,
    author: {
      "@type": "Person",
      name: article.author?.trim() || SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/logo.png"),
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: "id-ID",
    articleSection: article.category || undefined,
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
