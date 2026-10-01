import Link from "next/link";
import PageHero from "@/components/ui/PageHero";
import PtnFavoritAccordion from "@/components/features/PtnFavoritAccordion";
import { ArrowDown, Users } from "lucide-react";

/*
 * Server component: hero, judul seksi, dan catatan data statis.
 * Accordion (satu-satunya bagian ber-state) diisolasi di PtnFavoritAccordion.
 */
export default function PtnFavoritDirectory() {
  return (
    <div className="min-h-screen bg-cream">
      <PageHero
        title={
          <>
            Top 10 PTN <span className="text-brand-lime">Favorit SMAN 68</span>
          </>
        }
        lead="Sepuluh kampus tujuan terbanyak lulusan SMAN 68 Jakarta. Ketuk kampus untuk melihat informasi lengkap dan pintasan alumni."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/komunitas/alumni#direktori" className="btn-accent btn-lg">
            <Users size={16} aria-hidden="true" />
            Buka direktori alumni
          </Link>
          <a href="#peringkat" className="btn-secondary btn-lg">
            <ArrowDown size={16} aria-hidden="true" />
            Lihat peringkat
          </a>
        </div>
      </PageHero>

      <div id="peringkat" className="container-custom py-10 md:py-14 scroll-mt-28">
        <div className="mb-6">
          <h2 className="font-display font-extrabold text-xl md:text-2xl text-ink">
            Peringkat 1-10
          </h2>
          <p className="text-sm text-muted mt-1 max-w-[70ch]">
            Urutan disusun dari jejak alumni dan hasil SNBP/SNBT terakhir, bukan peringkat resmi.
            Ketuk kartu untuk membuka informasi lengkap.
          </p>
        </div>

        <PtnFavoritAccordion />

        <div className="card-static p-6 mt-6 md:mt-8">
          <h2 className="font-display font-bold text-lg text-ink mb-1">Catatan data</h2>
          <p className="text-sm text-muted leading-relaxed max-w-[75ch]">
            Daya tampung, jalur, dan biaya berubah setiap tahun. Selalu verifikasi di situs resmi
            kampus dan portal SNPMB sebelum mendaftar. Tombol “Alumni kampus ini” membuka direktori
            alumni yang otomatis tersaring per kampus.
          </p>
        </div>
      </div>
    </div>
  );
}
