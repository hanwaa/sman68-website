import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import NewsTicker from "@/components/sections/NewsTicker";
import PPDBBanner from "@/components/sections/PPDBBanner";
import AchievementSection from "@/components/sections/AchievementSection";
import AboutSection from "@/components/sections/AboutSection";
import FacilitiesHighlight from "@/components/sections/FacilitiesHighlight";
import ConstellationSection from "@/components/sections/ConstellationSection";
import NewsSection from "@/components/sections/NewsSection";
import CommunityBand from "@/components/sections/CommunityBand";
import PeopleSection from "@/components/sections/PeopleSection";
import ContactSection from "@/components/sections/ContactSection";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "SMA Negeri 68 Jakarta — Situs Resmi",
  description:
    "Situs resmi SMA Negeri 68 Jakarta (NPSN 20100199): profil sekolah, akademik, prestasi, kegiatan, galeri, alumni, dan informasi PPDB.",
  path: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <HeroSection />
        <NewsTicker />
        <PPDBBanner />
        <AchievementSection />
        <AboutSection />
        <FacilitiesHighlight />
        <ConstellationSection />
        <NewsSection />
        <CommunityBand />
        <PeopleSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
