"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/dashboard") || pathname.startsWith("/login")) return;

    const payload = JSON.stringify({ path: pathname });
    const timer = setTimeout(() => {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* statistik tidak boleh mengganggu navigasi */
      });
    }, 700);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
