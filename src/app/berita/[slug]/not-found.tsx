import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { Newspaper } from "lucide-react";

export const metadata: Metadata = { title: "Artikel tidak ditemukan" };

export default function BeritaNotFound() {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        className="pt-16 md:pt-[6.5rem] min-h-screen bg-cream flex items-center justify-center"
      >
        <div className="text-center px-6">
          <div className="w-14 h-14 rounded-xl bg-white border border-line flex items-center justify-center mx-auto mb-4">
            <Newspaper size={24} className="text-muted" aria-hidden="true" />
          </div>
          <h1 className="font-display font-bold text-2xl text-ink mb-2">Artikel tidak ditemukan</h1>
          <p className="text-muted text-sm mb-6">
            Artikel yang kamu cari mungkin sudah dipindahkan atau tidak pernah ada.
          </p>
          <Link href="/berita" className="btn-ghost">
            ← Kembali ke Berita
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
