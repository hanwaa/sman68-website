"use client";

import type { RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MODAL_PANEL, MODAL_TRANSITION } from "@/lib/motion";
import { Camera, Check, RotateCcw, X } from "lucide-react";

type Props = {
  open: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  selfiePreview: string | null;
  cameraError: string | null;
  cameraReady: boolean;
  onClose: () => void;
  onRetake: () => void;
  onCameraReady: () => void;
  onRetryCamera: () => void;
  onCapture: () => void;
  onSubmit: () => void;
};

export default function CheckinModal({
  open,
  modalRef,
  videoRef,
  canvasRef,
  selfiePreview,
  cameraError,
  cameraReady,
  onClose,
  onRetake,
  onCameraReady,
  onRetryCamera,
  onCapture,
  onSubmit,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MODAL_TRANSITION}
            onClick={onClose}
            className="absolute inset-0 bg-brand-pine/70"
          />
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Presensi Selfie"
            initial={MODAL_PANEL.initial}
            animate={MODAL_PANEL.animate}
            exit={MODAL_PANEL.exit}
            transition={MODAL_TRANSITION}
            className="relative w-full max-w-sm bg-white rounded-xl p-6 sm:p-7 shadow-card z-10 focus:outline-none"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Camera size={20} className="text-brand-leaf" />
                <h3 className="font-display font-bold text-lg text-ink">Presensi Selfie</h3>
              </div>
              <button onClick={onClose} className="btn-icon" aria-label="Tutup presensi selfie">
                <X size={18} />
              </button>
            </div>

            {selfiePreview ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selfiePreview}
                  alt="Pratinjau foto selfie presensi"
                  className="w-full aspect-square rounded-xl object-cover border border-line"
                />
                <div className="flex gap-2 mt-4">
                  <button onClick={onRetake} className="btn-outline flex-1 text-xs">
                    <RotateCcw size={14} aria-hidden="true" /> Ulangi
                  </button>
                  <button onClick={onSubmit} className="btn-primary flex-1 text-xs">
                    <Check size={14} aria-hidden="true" /> Kirim Presensi
                  </button>
                </div>
              </div>
            ) : cameraError ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-xl bg-cream border border-line flex items-center justify-center mx-auto mb-3">
                  <Camera size={24} className="text-muted" aria-hidden="true" />
                </div>
                <p className="text-sm text-muted leading-relaxed mb-5">{cameraError}</p>
                <button onClick={onRetryCamera} className="btn-primary text-xs px-5 py-2.5">
                  <RotateCcw size={15} /> Coba Lagi
                </button>
              </div>
            ) : (
              <div>
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-brand-pine">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    onLoadedMetadata={onCameraReady}
                    className="w-full h-full object-cover"
                    aria-label="Kamera selfie"
                  />
                </div>
                <p className="text-xs text-muted text-center mt-3">
                  {cameraReady
                    ? "Posisikan wajah di dalam bingkai, lalu ambil foto."
                    : "Menyalakan kamera..."}
                </p>
                <button
                  onClick={onCapture}
                  disabled={!cameraReady}
                  className="btn-primary w-full text-xs py-2.5 mt-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Camera size={15} /> Ambil Foto
                </button>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
