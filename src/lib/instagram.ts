import "server-only";

import {
  mapInstagramFeedPayload,
  mapScrapeCreatorsPayload,
  type InstagramFeed,
} from "@/lib/instagram-feed";

export type { InstagramFeed, InstagramPost } from "@/lib/instagram-feed";

// Cache 24 jam (1x fetch per hari): hemat credit/kuota layanan, cukup segar untuk highlight berita.
const REVALIDATE_SECONDS = 86400;
const DEFAULT_USERNAME = "smanegeri68jakarta";

async function fetchJsonFeed(url: string): Promise<InstagramFeed | null> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return null;
  return mapInstagramFeedPayload(await response.json());
}

/** ScrapeCreators: endpoint posts publik (butuh API key, tanpa login pemilik akun). */
async function fetchScrapeCreators(
  username: string,
  apiKey: string
): Promise<InstagramFeed | null> {
  const url = `https://api.scrapecreators.com/v2/instagram/user/posts?handle=${encodeURIComponent(
    username
  )}`;
  const response = await fetch(url, {
    headers: { "x-api-key": apiKey, Accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return null;
  return mapScrapeCreatorsPayload(await response.json());
}

/**
 * Ambil feed Instagram di server (dipakai /api/content?resource=instagram).
 * Urutan sumber:
 * 1. INSTAGRAM_FEED_URL, JSON feed dari widget (Behold dll.)
 * 2. SCRAPECREATORS_API_KEY, scrape endpoint posts by username
 * Mengembalikan null bila semua sumber tak tersedia/gagal.
 */
export async function getInstagramFeed(): Promise<InstagramFeed | null> {
  const feedUrl = process.env.INSTAGRAM_FEED_URL;
  if (feedUrl) {
    try {
      const feed = await fetchJsonFeed(feedUrl);
      if (feed) return feed;
    } catch {
      /* lanjut ke sumber berikutnya */
    }
  }

  const apiKey = process.env.SCRAPECREATORS_API_KEY;
  if (apiKey) {
    try {
      return await fetchScrapeCreators(
        process.env.INSTAGRAM_USERNAME || DEFAULT_USERNAME,
        apiKey
      );
    } catch {
      return null;
    }
  }

  return null;
}
