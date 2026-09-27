"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useA11y } from "@/components/providers/A11yProvider";
import { useContent } from "@/lib/use-content";

const headline = ["Selamat", "Datang", "di", "SMA Negeri 68 Jakarta"];

export default function HeroSection() {
  const heroSlides = useContent<{ id: string; src: string; alt: string; caption: string }[]>("hero", []);
  const { reduceMotion: a11yPaused } = useA11y();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const slideCount = heroSlides.length;

  useEffect(() => {
    if (paused || a11yPaused || slideCount === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % slideCount);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, a11yPaused, slideCount]);

  useEffect(() => {
    if (currentSlide >= slideCount && slideCount > 0) setCurrentSlide(0);
  }, [currentSlide, slideCount]);

  const prevSlide = () => {
    if (slideCount === 0) return;
    setCurrentSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length);
  };
  const nextSlide = () => {
    if (slideCount === 0) return;
    setCurrentSlide((s) => (s + 1) % heroSlides.length);
  };

  const prefersReduced = useReducedMotion();
  const reduceMotion = prefersReduced || a11yPaused;
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], [0, 300]);
  const contentY = useTransform(scrollY, [0, 800], [0, -50]);

  return (
    <section
      className="hero-slideshow relative min-h-screen flex items-center overflow-hidden bg-brand-pine"
      aria-label="Hero — Identitas SMAN 68 Jakarta"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute -top-20 -bottom-20 inset-x-0" aria-hidden="true">
        <motion.div
          style={reduceMotion ? undefined : { y: bgY }}
          className="absolute inset-0"
        >
          <AnimatePresence mode="sync" initial={false}>
            {slideCount > 0 && (
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={heroSlides[currentSlide].src}
                  alt={heroSlides[currentSlide].alt}
                  fill
                  priority={currentSlide === 0}
                  className="object-cover object-[center_30%] sm:object-center animate-kenburns brightness-[0.82]"
                  sizes="100vw"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-0 bg-brand-pine/50" />
        </motion.div>
      </div>

      <div className="container-custom relative z-10 pt-24 md:pt-28 pb-24 md:pb-32 translate-y-8 md:translate-y-12">
        <motion.div
          style={reduceMotion ? undefined : { y: contentY }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1
            className="font-display font-extrabold text-white mb-8 text-balance drop-shadow-[0_2px_12px_rgba(11,46,32,0.65)]"
            style={{
              fontFamily: "var(--font-hero)",
              fontWeight: 700,
              fontSize: "clamp(1.875rem, 5.4vw, 4.5rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
            }}
          >
            {headline.map((word, i) => (
              <Fragment key={i}>
                {i > 0 ? " " : null}
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.08 + i * 0.08 }}
                  className={`inline-block ${i === headline.length - 1 ? "text-brand-lime" : ""}`}
                >
                  {word}
                </motion.span>
              </Fragment>
            ))}
          </h1>

          <p className="text-white/90 text-[17px] md:text-[19px] lg:text-[22px] max-w-2xl mx-auto mb-10 md:mb-12 leading-relaxed text-pretty drop-shadow-[0_1px_8px_rgba(11,46,32,0.7)]">
            Jelajahi lebih dekat cerita, prestasi,
            dan semangat yang menjadikan SMAN 68 Jakarta terus bertumbuh.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/ppdb"
                className="btn-accent btn-hero group"
              >
                Jadilah Bagian Dari 68
                <ArrowRight
                  size={17}
                  className="group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 inset-x-0 z-20 h-[2px] bg-surface-2">
        <span
          key={currentSlide}
          className="hero-progress block h-full w-full rounded-r-full bg-brand-lime"
        />
      </div>

      <button
        onClick={prevSlide}
        className="btn-icon-dark absolute left-3 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full border border-edge-2 bg-brand-pine hover:border-brand-leaf hover:bg-brand-green-deep md:left-6 md:h-12 md:w-12"
        aria-label="Foto sebelumnya"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        onClick={nextSlide}
        className="btn-icon-dark absolute right-3 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full border border-edge-2 bg-brand-pine hover:border-brand-leaf hover:bg-brand-green-deep md:right-6 md:h-12 md:w-12"
        aria-label="Foto berikutnya"
      >
        <ChevronRight size={20} />
      </button>
    </section>
  );
}
