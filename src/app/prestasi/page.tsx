import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AchievementWall from "@/components/features/AchievementWall";
import JsonLd from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import { getAchievements } from "@/lib/content-server";
import { breadcrumbSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Dinding Prestasi",
  description: "Visualisasi seluruh prestasi SMA Negeri 68 Jakarta, dari tingkat kota hingga internasional.",
  path: "/prestasi",
});

export default async function PrestasiPage() {
  const achievements = await getAchievements();
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <JsonLd
          data={breadcrumbSchema([
            { name: "Beranda", path: "/" },
            { name: "Dinding Prestasi", path: "/prestasi" },
          ])}
        />
        <AchievementWall initialAchievements={achievements} />
      </main>
      <Footer />
    </>
  );
}
