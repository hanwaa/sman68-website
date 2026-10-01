import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PtnFavoritDirectory from "@/components/features/PtnFavoritDirectory";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Top 10 PTN Favorit",
  description:
    "Sepuluh perguruan tinggi negeri favorit lulusan SMAN 68 Jakarta, profil singkat, tautan resmi, dan direktori alumni per kampus.",
  path: "/komunitas/ptnfavorit",
});

export default function PtnFavoritPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <PtnFavoritDirectory />
      </main>
      <Footer />
    </>
  );
}
