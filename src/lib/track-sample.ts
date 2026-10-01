/** Fraksi pageview yang ditulis ke DB (0-1). Lihat TRACK_SAMPLE_RATE di .env. */
export function trackSampleRate(): number {
  const raw = Number(process.env.TRACK_SAMPLE_RATE ?? 0.2);
  if (!Number.isFinite(raw)) return 0.2;
  return Math.min(Math.max(raw, 0), 1);
}

/**
 * Faktor pengali agar angka dasbor tetap merepresentasikan traffic penuh.
 * Sampling deterministik per pengunjung = tak bias, jadi estimasi = hitungan × skala.
 */
export function trackScale(): number {
  const rate = trackSampleRate();
  return rate >= 1 ? 1 : Math.round(1 / rate);
}

/** True bila angka traffic adalah estimasi sampel, bukan sensus. */
export function trafficSampled(): boolean {
  return trackSampleRate() < 1;
}
