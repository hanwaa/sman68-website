"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Jeda masuk dalam detik, kelipatan kecil agar terasa berurutan. */
  delay?: number;
  className?: string;
};

/**
 * Reveal sekali saat elemen masuk viewport.
 * - Hanya opacity + transform (kompositor, bukan layout).
 * - Kurva --ease-out (0.23, 1, 0.32, 1), 450ms, konten, bukan UI kontrol.
 * - prefers-reduced-motion: tampil statis tanpa gerak.
 */
export default function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: "translateY(20px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
