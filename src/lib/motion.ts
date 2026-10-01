import type { TargetAndTransition, Transition } from "framer-motion";

export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export const MODAL_PANEL: {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
} = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 12 },
};

export const MODAL_TRANSITION: Transition = { duration: 0.2, ease: EASE_OUT };

export const TOAST_PANEL: typeof MODAL_PANEL = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
};

export const TOAST_TRANSITION: Transition = { duration: 0.25, ease: EASE_OUT };

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return (
    document.documentElement.classList.contains("a11y-motion-off") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
