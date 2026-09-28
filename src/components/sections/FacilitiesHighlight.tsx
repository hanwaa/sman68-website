"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Map } from "lucide-react";
import type { FacilityContent } from "@/lib/content";
import { useContentResource } from "@/lib/use-content";
import { SkeletonGrid } from "@/components/ui/Skeleton";
import SectionHeader from "@/components/ui/SectionHeader";

export default function FacilitiesHighlight() {
  const { data: content, loading } = useContentResource<{
    facilities: FacilityContent[];
    highlights: { id: string; title: string; description: string; image: string }[];
  }>("facilities", { facilities: [], highlights: [] });

  const facilities = content.highlights.map((item) => ({
    src: item.image,
    label: item.title,
    sub: item.description,
  }));

  return (
    <section className="section-padding bg-cream" aria-label="Fasilitas sekolah">
      <div className="container-custom">
        <SectionHeader
          title={
            <>
              Ruang Tumbuh yang <span className="text-brand-leaf">Lengkap</span>
            </>
          }
          lead="Lingkungan belajar yang dirancang untuk mendukung akademik, riset, olahraga, dan kehidupan komunitas siswa."
          action={
            <Link
              href="/tentang/fasilitas"
              className="btn-ghost inline-flex"
            >
              <Map size={15} />
              Denah & Fasilitas
              <ChevronRight size={15} />
            </Link>
          }
          className="mb-10 md:mb-14"
        />

        {loading && facilities.length === 0 && (
          <SkeletonGrid
            count={4}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
            itemClassName="aspect-[4/3]"
          />
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {facilities.map((item) => (
            <Link
              key={item.label}
              href="/tentang/fasilitas"
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-line"
            >
              <Image
                src={item.src}
                alt={item.label}
                fill
                className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-brand-pine/85 via-brand-pine/20 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4">
                <span className="block font-display font-bold text-white text-sm leading-tight">
                  {item.label}
                </span>
                <span className="block text-white/65 text-[11px] mt-0.5">{item.sub}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
