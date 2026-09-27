"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const OVERLAY_HOST_ID = "sman68-a11y-overlay";

/**
 * Node tempat seluruh overlay viewport (`position: fixed`) dipindahkan.
 *
 * Kenapa perlu: saat mode kontras tinggi / hitam putih aktif, `filter` dipasang
 * pada <main> dan pada elemen ber-kelas `a11y-layer`. Properti `filter` membuat
 * elemen tersebut menjadi containing block bagi keturunannya yang
 * `position: fixed`, sehingga modal ikut terukur mengikuti <main> dan ikut
 * ter-scroll bersama halaman — posisinya rusak. Dengan memindahkan overlay ke
 * sibling <main>, posisi fixed-nya kembali relatif ke viewport, sementara
 * warnanya tetap ikut berubah karena overlay itu sendiri memakai `a11y-layer`.
 *
 * Node ini statis (tanpa position/z-index) supaya tidak membentuk stacking
 * context sendiri: anak-anaknya tetap bersaing di stacking context root,
 * berdampingan dengan navbar dan FAB.
 */
export function A11yOverlayHost() {
  return <div id={OVERLAY_HOST_ID} />;
}

export function A11yOverlay({ children }: { children: React.ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(document.getElementById(OVERLAY_HOST_ID));
  }, []);

  if (!host) return null;
  return createPortal(children, host);
}
