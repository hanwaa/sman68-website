import "server-only";

const SEARCH_ENDPOINT = "https://api.search.tinyfish.ai";
const FETCH_ENDPOINT = "https://api.fetch.tinyfish.ai";
const TIMEOUT_MS = 5_000;

export type WebSource = { title: string; url: string; snippet: string };

export type WebSearchOptions = {
  limit?: number;
  /** Berapa halaman hasil yang diambil (masing-masing 10 hasil). Default 3 → s/d 30 hasil. */
  pages?: number;
  includeDomains?: string[];
  /** Batasi ke satu domain lewat operator site: (lebih ketat dari include_domains). */
  site?: string;
};

const SCHOOL_MENTIONS = [
  "sman 68",
  "sman68",
  "sma negeri 68",
  "sma n 68",
  "smanegeri68",
  "68 jakarta",
];

const OFFICIAL_DOMAINS = [
  "jakarta.go.id",
  "kemdikdasmen.go.id",
  "kemendikdasmen.go.id",
  "sman68jkt.sch.id",
  "sman68-jkt.my.id",
];

const BLOCKED_HOSTS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "youtube.com",
  "reddit.com",
  "linkedin.com",
  "pinterest.com",
  "quora.com",
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function mentionsSchool(source: WebSource): boolean {
  const haystack = `${source.title} ${source.snippet} ${source.url}`.toLowerCase();
  return SCHOOL_MENTIONS.some((mention) => haystack.includes(mention));
}

function isOfficialDomain(url: string): boolean {
  const host = hostOf(url);
  return OFFICIAL_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

export function isOfficialSource(url: string): boolean {
  return isOfficialDomain(url);
}

/** Berapa bagian kata kunci pertanyaan yang muncul di teks sumber. */
export function keywordCoverage(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const haystack = text.toLowerCase();
  const hits = keywords.filter((word) => haystack.includes(word)).length;
  return hits / keywords.length;
}

/** Hanya sumber yang jelas-jelas tentang SMAN 68 Jakarta yang boleh dipakai. */
export function isAboutSchool(source: WebSource, allowOfficial: boolean): boolean {
  const host = hostOf(source.url);
  if (BLOCKED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) {
    return false;
  }
  if (mentionsSchool(source)) return true;
  return allowOfficial && isOfficialDomain(source.url);
}

type SearchResponse = {
  results?: {
    title?: string;
    url?: string;
    snippet?: string;
    domain?: string;
  }[];
};

type FetchResponse = {
  results?: { title?: string; url?: string; text?: string }[];
  errors?: unknown[];
};

export function tinyfishConfigured(): boolean {
  return Boolean(process.env.TINYFISH_API_KEY);
}

const CONTROL_CHARS = /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g;

function clean(text: string, maxLength = 600): string {
  return text
    .replace(CONTROL_CHARS, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function apiKey(): string | null {
  return process.env.TINYFISH_API_KEY ?? null;
}

const cache = new Map<string, { at: number; value: unknown }>();

async function cached<T>(key: string, ttl: number, run: () => Promise<T>): Promise<T | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;

  try {
    const value = await run();
    cache.set(key, { at: Date.now(), value });
    if (cache.size > 200) {
      const now = Date.now();
      for (const [existing, entry] of cache) {
        if (now - entry.at > ttl) cache.delete(existing);
        if (cache.size <= 200) break;
      }
      // Batas keras FIFO bila semua entry masih segar.
      while (cache.size > 200) {
        const oldest = cache.keys().next();
        if (oldest.done) break;
        cache.delete(oldest.value);
      }
    }
    return value;
  } catch (error) {
    console.warn("[tinyfish] gagal:", error instanceof Error ? error.message : error);
    return null;
  }
}

export async function webSearch(
  query: string,
  options: WebSearchOptions = {}
): Promise<WebSource[]> {
  const { limit = 12, pages = 3, includeDomains, site } = options;
  const key = apiKey();
  if (!key || !query.trim()) return [];

  const scopedQuery = site ? `${query} site:${site}` : query;
  const cacheKey = `s:${scopedQuery.toLowerCase()}:${includeDomains?.join("|") ?? ""}:${pages}`;

  const result = await cached<WebSource[]>(cacheKey, 10 * 60_000, async () => {
    const collected: WebSource[] = [];
    const seen = new Set<string>();

    for (let page = 0; page < Math.min(pages, 10); page += 1) {
      const url = new URL(SEARCH_ENDPOINT);
      url.searchParams.set("query", scopedQuery);
      url.searchParams.set("language", "id");
      url.searchParams.set("location", "ID");
      url.searchParams.set("page", String(page));
      url.searchParams.set(
        "purpose",
        "Menjawab pertanyaan pengunjung website SMAN 68 Jakarta tentang informasi terbaru"
      );
      if (includeDomains?.length) {
        url.searchParams.set("include_domains", includeDomains.join(","));
      }

      const response = await fetch(url, {
        headers: { "X-API-Key": key },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`search ${response.status}`);

      const data = (await response.json()) as SearchResponse;
      const items = data.results ?? [];
      if (items.length === 0) break;

      for (const item of items) {
        if (!item.url || !item.title) continue;
        if (seen.has(item.url)) continue;
        seen.add(item.url);
        collected.push({
          title: clean(item.title, 140),
          url: item.url,
          snippet: clean(item.snippet ?? ""),
        });
        if (collected.length >= limit) break;
      }

      if (collected.length >= limit) break;
    }

    return collected;
  });

  return result ?? [];
}

export async function webFetchText(url: string): Promise<string | null> {
  const key = apiKey();
  if (!key) return null;

  const result = await cached<string | null>(`f:${url}`, 30 * 60_000, async () => {
    const response = await fetch(FETCH_ENDPOINT, {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: [url],
        format: "markdown",
        ttl: 3600,
        purpose: "Mengambil informasi terbaru untuk chatbot website sekolah",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`fetch ${response.status}`);

    const data = (await response.json()) as FetchResponse;
    const text = data.results?.[0]?.text ?? "";
    const cleaned = text.replace(CONTROL_CHARS, " ");
    return cleaned.trim().length > 400 ? cleaned : null;
  });

  return result ?? null;
}

const SENTENCE_SPLIT = /(?<=[.!?])\s+|\n+/;

function keywordsOf(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3)
    )
  );
}

/** Ambil maksimal dua kalimat yang paling relevan dengan pertanyaan. */
export function extractRelevant(text: string, query: string, maxChars = 420): string {
  const words = keywordsOf(query);
  const sentences = text
    .split(SENTENCE_SPLIT)
    .map((sentence) => sentence.replace(/^[-*#>\s]+/, "").replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length > 40 && sentence.length < 400);

  const scored = sentences
    .map((sentence, index) => {
      const lower = sentence.toLowerCase();
      const score = words.reduce((total, word) => (lower.includes(word) ? total + 1 : total), 0);
      return { sentence, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const picked = scored
    .filter((item) => item.score > 0)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  if (picked.length === 0) return "";
  const joined = picked.join(" ");
  return joined.length > maxChars ? `${joined.slice(0, maxChars).trim()}...` : joined;
}
