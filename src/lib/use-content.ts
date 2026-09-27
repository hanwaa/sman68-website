"use client";

import { useEffect, useState } from "react";

type CacheEntry = { data: unknown; at: number };

const TTL_MS = 5 * 60 * 1000; // data dianggap segar 5 menit
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

async function loadResource(resource: string): Promise<unknown | null> {
  if (!resource) return null;
  const existing = inflight.get(resource);
  if (existing) return existing;
  const promise = fetch(`/api/content?resource=${encodeURIComponent(resource)}`, {
    cache: "no-store",
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((payload: { data?: unknown } | null) => payload?.data ?? null)
    .finally(() => inflight.delete(resource));
  inflight.set(resource, promise);
  return promise;
}

/**
 * Ambil konten dari DB lewat /api/content dengan cache client + dedupe request.
 * `loading` true hanya saat benar-benar belum ada data sama sekali.
 */
const isBrowser = typeof window !== "undefined";

export function useContentResource<T>(
  resource: string,
  fallback: T,
  initialData?: T
): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(() => {
    // Di server: selalu pakai data fresh dari render (initialData/fallback) —
    // jangan sentuh cache modul agar tidak bocor antar-request.
    if (!isBrowser) return initialData !== undefined ? initialData : fallback;

    const cached = cache.get(resource);
    if (cached) return cached.data as T;
    if (initialData !== undefined) {
      cache.set(resource, { data: initialData, at: Date.now() });
      return initialData;
    }
    return fallback;
  });
  // Nilai awal `loading` WAJIB sama di server dan client, karena render
  // pertama client adalah hydration dari HTML server. Kalau berbeda, React
  // membuang HTML itu dan regenerate di client — gejalanya "Hydration failed"
  // plus flash skeleton.
  //
  // Server juga bernilai `initialData === undefined` (bukan selalu false):
  // saat hydration, context JS client masih kosong sehingga cache modul pasti
  // kosong dan `initialData` undefined. Server yang mengembalikan `false`
  // sementara client `true`-lah yang memicu mismatch. Menyamakan keduanya ke
  // `initialData === undefined` membuat keduanya `true` pada kasus itu.
  //
  // Cache modul di server tidak pernah terisi (loadResource hanya jalan di
  // useEffect, yaitu client), jadi `cache.has` selalu false di server dan
  // tidak risiko bocor antar-request. Pemakaian cache tetap berguna saat
  // navigasi client, yang bukan hydration.
  const [loading, setLoading] = useState(
    () => initialData === undefined && !cache.has(resource)
  );

  useEffect(() => {
    if (!isBrowser || !resource) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const cached = cache.get(resource);
    if (cached && Date.now() - cached.at < TTL_MS) {
      setData(cached.data as T);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadResource(resource)
      .then((payload) => {
        if (cancelled || payload == null) return;
        cache.set(resource, { data: payload, at: Date.now() });
        setData(payload as T);
      })
      .catch(() => {
        /* gunakan fallback */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resource]);

  return { data, loading };
}

/**
 * Versi ringkas (kompatibel lama): hanya mengembalikan data.
 * Cache tetap dipakai sehingga pindah halaman tidak memuat ulang dari nol.
 */
export function useContent<T>(resource: string, fallback: T): T {
  return useContentResource(resource, fallback).data;
}
