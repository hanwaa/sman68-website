import PhotoBackdrop from "@/components/sections/PhotoBackdrop";

export default function CommunityBand() {
  return (
    <section
      className="relative py-24 md:py-32 flex items-center justify-center bg-brand-pine"
      aria-label="Motto SMAN 68 Jakarta"
    >
      <PhotoBackdrop src="/assets/sekolah/sekolah-06-apel.jpg" overlayClassName="bg-black/55" />

      <div className="container-custom relative text-center">
          <p className="font-display font-extrabold uppercase text-white text-balance text-3xl md:text-5xl tracking-[0.06em]">
            Disiplin <span className="text-white/40">·</span> Kreasi{" "}
            <span className="text-white/40">·</span>{" "}
            <span className="text-brand-lime">Prestasi</span>
          </p>
        </div>
    </section>
  );
}
