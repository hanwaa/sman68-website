"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TestimonialContent } from "@/lib/content";
import { useContentResource } from "@/lib/use-content";
import SectionHeader from "@/components/ui/SectionHeader";

const PHOTO_SPANS = ["col-span-2 row-span-2", "", "", "", ""];

export default function PeopleSection() {
  const { data: people, loading } = useContentResource<{
    testimonials: TestimonialContent[];
    photos: { src: string; alt: string }[];
  }>("testimonials", { testimonials: [], photos: [] });

  const testimonials = people.testimonials.map((testimonial) => ({
    id: testimonial.id,
    name: testimonial.name,
    role: testimonial.role,
    content: testimonial.quote,
    avatar: testimonial.photo,
  }));

  const photoGrid = people.photos.map((photo, i) => ({
    id: i + 1,
    src: photo.src,
    label: photo.alt,
    span: PHOTO_SPANS[i] ?? "",
  }));

  const [activeIndex, setActiveIndex] = useState(0);
  const active = testimonials[activeIndex] ?? null;

  return (
    <section id="testimoni" className="section-padding bg-cream scroll-mt-20" aria-label="Komunitas: Orang-orang SMAN 68">
      <div className="container-custom">
        <SectionHeader
          title={
            <>
              Orang-orang yang Membuat{" "}
              <span className="text-brand-leaf">SMAN 68 Hidup</span>
            </>
          }
          lead="Siswa, guru, orang tua, dan alumni. Komunitas yang saling mendukung dan menginspirasi."
          action={
            <Link href="/komunitas/alumni" className="btn-ghost inline-flex">
              Jelajahi Alumni
              <ChevronRight size={16} />
            </Link>
          }
          className="mb-12 md:mb-16"
        />

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 auto-rows-[130px] sm:auto-rows-[150px] gap-3"
          >
            {loading && photoGrid.length === 0 &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={`sk-${i}`} className="animate-pulse rounded-xl bg-line/70" aria-hidden="true" />
              ))}
            {photoGrid.map((photo) => (
              <div
                key={photo.id}
                className={cn("relative rounded-xl overflow-hidden group", photo.span)}
              >
                <Image
                  src={photo.src}
                  alt={photo.label}
                  fill
                  className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-pine/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-2.5 left-3 right-3 text-white text-xs font-semibold">
                  {photo.label}
                </span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="lg:col-span-5 lg:sticky lg:top-24"
          >
            <Quote size={36} className="text-brand-leaf" aria-hidden="true" />

            {loading && !active ? (
              <div className="mt-5 space-y-3" aria-hidden="true">
                <div className="h-5 w-full animate-pulse rounded bg-line/70" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-line/70" />
                <div className="h-5 w-3/5 animate-pulse rounded bg-line/70" />
                <div className="mt-6 h-4 w-32 animate-pulse rounded bg-line/70" />
              </div>
            ) : active ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.blockquote
                    key={active.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    className="mt-5 font-display text-xl md:text-2xl leading-snug text-ink min-h-[9.5rem]"
                  >
                    &ldquo;{active.content}&rdquo;
                  </motion.blockquote>
                </AnimatePresence>

                <div className="mt-6">
                  <div className="font-display font-bold text-ink">{active.name}</div>
                  <div className="text-muted text-sm mt-0.5">{active.role}</div>
                </div>
              </>
            ) : (
              <p className="mt-5 text-sm text-muted">
                Belum ada testimoni yang dipublikasikan.
              </p>
            )}

            <div className="mt-8 flex items-center gap-2.5">
              {testimonials.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActiveIndex(i)}
                  aria-pressed={i === activeIndex}
                  aria-label={`Testimoni ${t.name}`}
                  className={cn(
                    "w-11 h-11 rounded-full font-display font-bold text-xs flex items-center justify-center transition-colors duration-200 ease-out",
                    i === activeIndex
                      ? "bg-brand-pine text-white ring-2 ring-brand-lime ring-offset-2 ring-offset-cream"
                      : "bg-white border border-line text-muted hover:text-ink hover:border-muted"
                  )}
                >
                  {t.avatar}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
