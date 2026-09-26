"use client";

import { useEffect, useState } from "react";
import { mapInstagramFeedPayload, type InstagramFeed } from "@/lib/instagram-feed";
import { useContentResource } from "@/lib/use-content";

const TTL_MS = 5 * 60 * 1000;

let cache: { data: InstagramFeed | null; at: number } | null = null;
let inflight: Promise<InstagramFeed | null> | null = null;

/** Fetch langsung dari browser ke URL feed JSON (harus mengizinkan CORS). */
async function fetchDirect(url: string): Promise<InstagramFeed | null> {
  if (inflight) return inflight;
  inflight = fetch(url, { headers: { Accept: "application/json" } })
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => mapInstagramFeedPayload(payload))
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

function useDirectFeed(url: string | undefined): {
  feed: InstagramFeed | null;
  loading: boolean;
} {
  const cached = url && cache && Date.now() - cache.at < TTL_MS ? cache.data : null;
  const [feed, setFeed] = useState<InstagramFeed | null>(cached);
  const [loading, setLoading] = useState(Boolean(url) && !cached);

  useEffect(() => {
    if (!url) {
      setFeed(null);
      setLoading(false);
      return;
    }
    if (cache && Date.now() - cache.at < TTL_MS) {
      setFeed(cache.data);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchDirect(url)
      .then((result) => {
        if (cancelled) return;
        cache = { data: result, at: Date.now() };
        setFeed(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { feed, loading };
}

export type InstagramFeedState = {
  feed: InstagramFeed | null;
  loading: boolean;
};

/**
 * Sumber data highlight Instagram:
 * - `NEXT_PUBLIC_INSTAGRAM_FEED_URL` diisi → fetch langsung dari browser (tanpa API route).
 * - Jika tidak → ambil lewat /api/content?resource=instagram (server, cache 24 jam / 1x sehari).
 * `enabled = false` (atau mode widget iframe aktif) → tidak ada request sama sekali.
 */
export function useInstagramFeed(enabled = true): InstagramFeedState {
  const embedUrl = process.env.NEXT_PUBLIC_INSTAGRAM_EMBED_URL;
  const active = enabled && !embedUrl;
  const directUrl = active ? process.env.NEXT_PUBLIC_INSTAGRAM_FEED_URL : undefined;
  const direct = useDirectFeed(directUrl);
  const server = useContentResource<InstagramFeed | null>(
    active && !directUrl ? "instagram" : "",
    null
  );

  if (!active) return { feed: null, loading: false };
  return directUrl ? direct : { feed: server.data, loading: server.loading };
}
