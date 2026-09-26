import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StrukturOrganisasi from "@/components/features/StrukturOrganisasi";
import JsonLd from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import { getOrgStructure } from "@/lib/content-server";
import { breadcrumbSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Struktur Organisasi",
  description:
    "Struktur organisasi SMA Negeri 68 Jakarta — kepala sekolah, wakil, guru per mata pelajaran, serta pengurus OSIS dan MPK.",
  path: "/tentang/struktur",
});

export default async function StrukturPage() {
  const org = await getOrgStructure();
  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-16 md:pt-[6.5rem]">
        <JsonLd
          data={breadcrumbSchema([
            { name: "Beranda", path: "/" },
            { name: "Tentang", path: "/tentang/profil" },
            { name: "Struktur Organisasi", path: "/tentang/struktur" },
          ])}
        />
        <StrukturOrganisasi initialOrg={org} />
      </main>
      <Footer />
    </>
  );
}
