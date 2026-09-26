import type { Metadata } from "next";

const FALLBACK_BASE = "https://sman68-jkt.my.id";

export const SITE_NAME = "SMAN 68 Jakarta";
export const DEFAULT_OG_IMAGE = "/assets/og-default.png";

export function siteBase(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env && /^https:\/\//.test(env) && !/localhost|127\.0\.0\.1/.test(env)) {
    return env.replace(/\/+$/, "");
  }
  return FALLBACK_BASE;
}

export function absoluteUrl(path = "/"): string {
  const base = siteBase();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  absoluteTitle?: boolean;
  publishedTime?: string;
  authors?: string[];
};

export function buildMetadata({
  title,
  description,
  path,
  type = "website",
  image = DEFAULT_OG_IMAGE,
  absoluteTitle = false,
  publishedTime,
  authors,
}: BuildMetadataInput): Metadata {
  const ogImage = {
    url: image,
    width: 1200,
    height: 630,
    alt: title,
  };

  const openGraph = {
    type,
    title,
    description,
    url: path,
    siteName: SITE_NAME,
    locale: "id_ID",
    images: [ogImage],
    ...(type === "article" ? { publishedTime, authors } : {}),
  } as Metadata["openGraph"];

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
