"use client";

import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ClassroomModal({
  open,
  onClose,
  label,
  dialogRef,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  dialogRef: RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-pine/70"
          />
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-xl bg-white p-5 text-ink shadow-card focus:outline-none sm:p-6",
              wide ? "max-w-2xl" : "max-w-md"
            )}
          >
            <button onClick={onClose} className="btn-icon absolute right-3 top-3" aria-label="Tutup">
              <X size={18} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
