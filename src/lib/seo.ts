import type { Metadata } from "next";

const FALLBACK_BASE = "https://sman68-jkt.my.id";

export const SITE_NAME = "SMAN 68 Jakarta";
// Nama file disengaja tidak generik: Google meng-cache gambar og:image
// berdasarkan URL dan bisa bertahan lama. Kalau desain file diubah, URL baru
// memaksa Google fetch ulang thumbnail di hasil pencarian.
export const DEFAULT_OG_IMAGE = "/assets/og-school.png";
export const OG_CARD_SIZE = { width: 1200, height: 630 };
const DEFAULT_OG_SIZE = OG_CARD_SIZE;
export const OG_CARD_PATH = "/api/og";

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

function toAbsolute(url: string): string {
  return /^https?:\/\//i.test(url) ? url : absoluteUrl(url);
}

function imageMime(url: string): string | undefined {
  const clean = url.split(/[?#]/)[0].toLowerCase();
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".svg")) return "image/svg+xml";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".png")) return "image/png";
  return undefined;
}

type OgCardInput = {
  title: string;
  category?: string | null;
  label?: string;
  image?: string | null;
};

/** Kartu OG 1200x630 bertenaga logo sekolah, dirender on-demand by /api/og. */
export function ogCardUrl({ title, category, label, image }: OgCardInput): string {
  const params = new URLSearchParams();
  params.set("title", title);
  if (category) params.set("category", category);
  if (label) params.set("label", label);
  if (image) params.set("image", image);
  return `${OG_CARD_PATH}?${params.toString()}`;
}

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
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
  imageWidth,
  imageHeight,
  absoluteTitle = false,
  publishedTime,
  authors,
}: BuildMetadataInput): Metadata {
  // WhatsApp/Telegram menolak preview bila og:image:width/height tidak sesuai
  // ukuran file asli. Gambar selain OG default (mis. cover berita 1024x283)
  // tidak boleh diklaim 1200x630 — dimensi hanya dideklarasi jika diketahui.
  const isCard = image.startsWith(OG_CARD_PATH);
  const isDefaultImage = image === DEFAULT_OG_IMAGE;
  const known = isDefaultImage || isCard;
  const width = imageWidth ?? (known ? DEFAULT_OG_SIZE.width : undefined);
  const height = imageHeight ?? (known ? DEFAULT_OG_SIZE.height : undefined);
  const absoluteImage = toAbsolute(image);
  const mime = isCard ? "image/png" : imageMime(image);

  const ogImage = {
    url: absoluteImage,
    secureUrl: absoluteImage,
    ...(mime ? { type: mime } : {}),
    ...(width && height ? { width, height } : {}),
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
      images: [absoluteImage],
    },
  };
}
