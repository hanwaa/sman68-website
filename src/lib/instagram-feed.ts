/**
 * Tipe + parser feed Instagram yang dipakai bersama server (API route)
 * dan client (browser fetch). Murni tanpa dependensi server.
 *
 * Mendukung dua bentuk payload:
 * 1. JSON feed penyedia widget (Behold) — { username, posts: [{ sizes, ... }] }
 * 2. Respons `web_profile_info` Instagram — { data: { user: { edge_owner_to_timeline_media } } }
 */

export type InstagramPost = {
  id: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  image: string;
  thumb: string;
  alt: string;
  caption: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
  isReel: boolean;
  dominantColor?: string;
};

export type InstagramFeed = {
  username: string;
  profilePictureUrl: string;
  followersCount: number;
  posts: InstagramPost[];
};

const DEFAULT_USERNAME = "smanegeri68jakarta";

type RawSize = { mediaUrl?: unknown; width?: unknown; height?: unknown };
type RawSizes = {
  small?: RawSize;
  medium?: RawSize;
  large?: RawSize;
  full?: RawSize;
};

type RawPost = {
  id?: unknown;
  timestamp?: unknown;
  permalink?: unknown;
  mediaType?: unknown;
  mediaUrl?: unknown;
  altText?: unknown;
  caption?: unknown;
  prunedCaption?: unknown;
  likeCount?: unknown;
  commentsCount?: unknown;
  isReel?: unknown;
  sizes?: RawSizes;
  colorPalette?: { dominant?: unknown } | null;
};

type RawFeed = {
  username?: unknown;
  profilePictureUrl?: unknown;
  followersCount?: unknown;
  posts?: unknown;
};

type RawIgNode = {
  id?: unknown;
  __typename?: unknown;
  is_video?: unknown;
  product_type?: unknown;
  display_url?: unknown;
  thumbnail_src?: unknown;
  shortcode?: unknown;
  taken_at_timestamp?: unknown;
  edge_liked_by?: { count?: unknown } | null;
  edge_media_preview_like?: { count?: unknown } | null;
  edge_media_to_comment?: { count?: unknown } | null;
  edge_media_to_caption?: { edges?: { node?: { text?: unknown } | null }[] | null } | null;
  edge_sidecar_to_children?: { edges?: unknown } | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function pickImage(sizes: RawSizes | undefined, ...keys: (keyof RawSizes)[]): string {
  for (const key of keys) {
    const url = sizes?.[key]?.mediaUrl;
    if (typeof url === "string" && url) return url;
  }
  return "";
}

function toDominantColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const rgb = value.split(",").map((part) => Number(part.trim()));
  if (rgb.length !== 3 || rgb.some((n) => !Number.isFinite(n))) return undefined;
  return `rgb(${rgb.map((n) => Math.min(255, Math.max(0, Math.round(n)))).join(", ")})`;
}

/* --------------------- Format 1: JSON feed widget ------------------------ */

function mapWidgetPost(raw: RawPost): InstagramPost | null {
  const image =
    pickImage(raw.sizes, "large", "full", "medium", "small") || String(raw.mediaUrl ?? "");
  const permalink = typeof raw.permalink === "string" ? raw.permalink : "";
  if (!image || !permalink) return null;

  const mediaType =
    raw.mediaType === "VIDEO" || raw.mediaType === "CAROUSEL_ALBUM" ? raw.mediaType : "IMAGE";

  return {
    id: String(raw.id ?? permalink),
    mediaType,
    image,
    thumb: pickImage(raw.sizes, "small", "medium", "large") || image,
    alt: typeof raw.altText === "string" ? raw.altText : "",
    caption:
      (typeof raw.prunedCaption === "string" && raw.prunedCaption) ||
      (typeof raw.caption === "string" ? raw.caption : ""),
    permalink,
    timestamp: typeof raw.timestamp === "string" ? raw.timestamp : "",
    likeCount: Number(raw.likeCount) || 0,
    commentsCount: Number(raw.commentsCount) || 0,
    isReel: Boolean(raw.isReel),
    dominantColor: toDominantColor(raw.colorPalette?.dominant),
  };
}

function mapWidgetFeed(payload: RawFeed): InstagramFeed | null {
  const rawPosts = Array.isArray(payload.posts) ? (payload.posts as RawPost[]) : [];
  const posts = rawPosts
    .map(mapWidgetPost)
    .filter((post): post is InstagramPost => post !== null)
    .slice(0, 12);
  if (posts.length === 0) return null;

  return {
    username:
      (typeof payload.username === "string" && payload.username) || DEFAULT_USERNAME,
    profilePictureUrl:
      typeof payload.profilePictureUrl === "string" ? payload.profilePictureUrl : "",
    followersCount: Number(payload.followersCount) || 0,
    posts,
  };
}

/* ----------------- Format 2: web_profile_info Instagram ------------------ */

function mapIgNode(node: RawIgNode): InstagramPost | null {
  const shortcode = typeof node.shortcode === "string" ? node.shortcode : "";
  const image =
    (typeof node.display_url === "string" && node.display_url) ||
    (typeof node.thumbnail_src === "string" && node.thumbnail_src) ||
    "";
  if (!shortcode || !image) return null;

  const typename = typeof node.__typename === "string" ? node.__typename : "";
  const mediaType: InstagramPost["mediaType"] =
    typename === "GraphSidecar"
      ? "CAROUSEL_ALBUM"
      : typename === "GraphVideo" || node.is_video
        ? "VIDEO"
        : "IMAGE";

  const captionEdge = node.edge_media_to_caption?.edges?.[0]?.node;
  const caption = captionEdge && typeof captionEdge.text === "string" ? captionEdge.text : "";
  const takenAt = Number(node.taken_at_timestamp);
  const likes =
    Number(node.edge_liked_by?.count) || Number(node.edge_media_preview_like?.count) || 0;

  return {
    id: String(node.id ?? shortcode),
    mediaType,
    image,
    thumb:
      (typeof node.thumbnail_src === "string" && node.thumbnail_src) || image,
    alt: "",
    caption,
    permalink: `https://www.instagram.com/p/${shortcode}/`,
    timestamp: Number.isFinite(takenAt) ? new Date(takenAt * 1000).toISOString() : "",
    likeCount: likes,
    commentsCount: Number(node.edge_media_to_comment?.count) || 0,
    isReel: mediaType === "VIDEO" && node.product_type === "clips",
  };
}

function mapProfileInfoFeed(payload: Record<string, unknown>): InstagramFeed | null {
  const data = payload.data;
  const user = isRecord(data) ? data.user : undefined;
  if (!isRecord(user)) return null;

  const media = isRecord(user.edge_owner_to_timeline_media)
    ? (user.edge_owner_to_timeline_media as Record<string, unknown>)
    : undefined;
  const edges = media && Array.isArray(media.edges) ? media.edges : [];

  const posts = edges
    .map((edge) => (isRecord(edge) && isRecord(edge.node) ? mapIgNode(edge.node as RawIgNode) : null))
    .filter((post): post is InstagramPost => post !== null)
    .slice(0, 12);
  if (posts.length === 0) return null;

  return {
    username: (typeof user.username === "string" && user.username) || DEFAULT_USERNAME,
    profilePictureUrl:
      typeof user.profile_pic_url_hd === "string"
        ? user.profile_pic_url_hd
        : typeof user.profile_pic_url === "string"
          ? user.profile_pic_url
          : "",
    followersCount: isRecord(user.edge_followed_by)
      ? Number(user.edge_followed_by.count) || 0
      : 0,
    posts,
  };
}

/* --------------- Format 3: ScrapeCreators /v2/instagram/user/posts ------- */

type RawScCandidate = { url?: unknown; width?: unknown; height?: unknown };
type RawScItem = {
  id?: unknown;
  code?: unknown;
  media_type?: unknown;
  product_type?: unknown;
  taken_at?: unknown;
  created_at?: unknown;
  like_count?: unknown;
  comment_count?: unknown;
  caption?: unknown;
  accessibility_caption?: unknown;
  image_versions2?: { candidates?: unknown } | null;
};

type RawScFeed = {
  items?: unknown;
  user?: unknown;
};

const scCandidates = (item: RawScItem): RawScCandidate[] =>
  isRecord(item.image_versions2) && Array.isArray(item.image_versions2.candidates)
    ? (item.image_versions2.candidates.filter(isRecord) as RawScCandidate[])
    : [];

function pickScImage(item: RawScItem): string {
  const candidates = scCandidates(item).filter(
    (c): c is RawScCandidate & { url: string } => typeof c.url === "string" && Boolean(c.url)
  );
  if (candidates.length === 0) return "";
  const preferred = candidates
    .filter((c) => Number(c.width) >= 1000)
    .sort((a, b) => Number(a.width) - Number(b.width))[0];
  const largest = [...candidates].sort(
    (a, b) => Number(b.width ?? 0) - Number(a.width ?? 0)
  )[0];
  return (preferred ?? largest)?.url ?? "";
}

function pickScThumb(item: RawScItem, fallback: string): string {
  const candidates = scCandidates(item).filter(
    (c): c is RawScCandidate & { url: string } => typeof c.url === "string" && Boolean(c.url)
  );
  const smallest = [...candidates].sort(
    (a, b) => Number(a.width ?? 0) - Number(b.width ?? 0)
  )[0];
  return smallest?.url ?? fallback;
}

/** Caption ScrapeCreators kadang berupa JSON string ({"text": "..."}), kadang string biasa. */
function parseCaptionText(value: unknown): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (isRecord(parsed) && typeof parsed.text === "string") return parsed.text;
      } catch {
        /* biarkan string apa adanya */
      }
    }
    return value;
  }
  if (isRecord(value) && typeof value.text === "string") return value.text;
  return "";
}

function mapScItem(item: RawScItem): InstagramPost | null {
  const code = typeof item.code === "string" ? item.code : "";
  const image = pickScImage(item);
  if (!code || !image) return null;

  const mediaType: InstagramPost["mediaType"] =
    item.media_type === 8 ? "CAROUSEL_ALBUM" : item.media_type === 2 ? "VIDEO" : "IMAGE";
  const takenAt = Number(item.taken_at);

  return {
    id: String(item.id ?? code),
    mediaType,
    image,
    thumb: pickScThumb(item, image),
    alt:
      typeof item.accessibility_caption === "string" ? item.accessibility_caption : "",
    caption: parseCaptionText(item.caption),
    permalink: `https://www.instagram.com/p/${code}/`,
    timestamp:
      typeof item.created_at === "string" && item.created_at
        ? item.created_at
        : Number.isFinite(takenAt)
          ? new Date(takenAt * 1000).toISOString()
          : "",
    likeCount: Number(item.like_count) || 0,
    commentsCount: Number(item.comment_count) || 0,
    isReel: mediaType === "VIDEO" && item.product_type === "clips",
  };
}

function mapScrapeCreatorsFeed(payload: RawScFeed): InstagramFeed | null {
  const items = Array.isArray(payload.items) ? (payload.items as RawScItem[]) : [];
  const user = isRecord(payload.user) ? payload.user : undefined;

  const posts = items
    .map(mapScItem)
    .filter((post): post is InstagramPost => post !== null)
    .slice(0, 12);
  if (posts.length === 0) return null;

  return {
    username: (user && typeof user.username === "string" && user.username) || DEFAULT_USERNAME,
    profilePictureUrl:
      user && typeof user.profile_pic_url === "string" ? user.profile_pic_url : "",
    followersCount: 0,
    posts,
  };
}

/* --------------------------------- Publik -------------------------------- */

/** Ubah payload mentah apa pun yang dikenal menjadi InstagramFeed; null bila tak cocok. */
export function mapInstagramFeedPayload(payload: unknown): InstagramFeed | null {
  if (!isRecord(payload)) return null;
  return mapWidgetFeed(payload as RawFeed) ?? mapProfileInfoFeed(payload);
}

/** Khusus respons ScrapeCreators (endpoint posts). */
export function mapScrapeCreatorsPayload(payload: unknown): InstagramFeed | null {
  if (!isRecord(payload)) return null;
  return mapScrapeCreatorsFeed(payload);
}
