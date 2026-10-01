import Image from "next/image";
import { cn } from "@/lib/utils";

/** Anggota dengan foto. */
export type MemberPhoto = { name: string; role: string; photo: string; desc?: string };
/** Anggota dengan atau tanpa foto (tanpa foto memakai monogram inisial). */
export type MemberAny = { name: string; role: string; photo?: string; desc?: string };

/** Lebar kartu seragam: 2 kolom di HP, 4 kolom di desktop. */
export const CARD_WIDTH =
  "w-[calc(50%-0.3125rem)] sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]";

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

export function FlatPersonCard({ name, role, photo, desc }: MemberPhoto) {
  return (
    <div
      className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-line bg-brand-pine shadow-card transition-[transform,border-color,box-shadow] duration-200 hover:border-brand-leaf/60 hover:shadow-card-hover hover:-translate-y-0.5"
      style={{ transitionTimingFunction: "var(--ease-out)" }}
    >
      <Image
        src={photo}
        alt={name}
        fill
        className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
        style={{ transitionTimingFunction: "var(--ease-out)" }}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-pine via-brand-pine/50 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3.5 z-10 text-white">
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-brand-lime mb-0.5 line-clamp-1">
          {role}
        </div>
        <div className="font-display font-bold text-xs sm:text-base leading-tight sm:leading-snug text-white line-clamp-2">
          {name}
        </div>
        {desc && (
          <div className="text-[10px] sm:text-[11px] text-white/80 line-clamp-1 sm:line-clamp-2 mt-1 leading-snug font-normal">
            {desc}
          </div>
        )}
      </div>
    </div>
  );
}

/** Kartu tanpa foto (mis. Komite Sekolah): monogram inisial. */
export function NameCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-line bg-brand-pine shadow-card">
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-display font-extrabold text-4xl sm:text-5xl text-brand-lime/70 select-none"
          aria-hidden="true"
        >
          {initials(name)}
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-brand-pine via-brand-pine/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3.5 z-10 text-white">
        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-brand-lime mb-0.5 line-clamp-1">
          {role}
        </div>
        <div className="font-display font-bold text-xs sm:text-base leading-tight sm:leading-snug text-white line-clamp-2">
          {name}
        </div>
      </div>
    </div>
  );
}

/** Otomatis: pakai foto bila ada, selain itu monogram. */
export function PersonCard({ name, role, photo, desc }: MemberAny) {
  if (photo) {
    return <FlatPersonCard name={name} role={role} photo={photo} desc={desc} />;
  }
  return <NameCard name={name} role={role} />;
}

export function LevelHeader({ title }: { title: string }) {
  return (
    <h2 className="min-w-0 text-center font-display text-base font-extrabold uppercase leading-tight tracking-[0.05em] text-ink sm:text-lg sm:tracking-[0.06em]">
      {title}
    </h2>
  );
}

export function FlatLine() {
  return (
    <div className="flex flex-col items-center my-4 sm:my-5" aria-hidden="true">
      <div className="w-[3px] rounded-full bg-brand-green/45 h-6 sm:h-7" />
      <div className="h-0 w-0 border-x-[5px] border-x-transparent border-t-[7px] border-t-brand-green/70 -mt-px" />
    </div>
  );
}

export function FlatBranch({ count }: { count: number }) {
  const stem = "w-[3px] rounded-full bg-brand-green/45";
  const drop = "w-[3px] bg-brand-green/45";
  const head = "h-0 w-0 border-x-[5px] border-x-transparent border-t-[7px] border-t-brand-green/70 -mt-px";
  if (count < 2) {
    return (
      <div className="flex flex-col items-center my-3" aria-hidden="true">
        <div className={cn(stem, "h-5")} />
        <div className={head} />
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-5xl my-3" aria-hidden="true">
      <div className="hidden lg:block">
        <div className={cn(stem, "mx-auto h-5")} />
        <div className="relative h-5">
          <div
            className="absolute top-0 h-[3px] rounded-full bg-brand-green/45"
            style={{ left: `${100 / (count * 2)}%`, right: `${100 / (count * 2)}%` }}
          />
          <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={cn(drop, "h-full")} />
                <div className={head} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center lg:hidden">
        <div className={cn(stem, "h-4")} />
        <div className={head} />
      </div>
    </div>
  );
}

/** Baris kartu setara: lebar seragam, di tengah bila tidak memenuhi satu baris. */
export function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 sm:mt-3 flex flex-wrap justify-center gap-2.5 sm:gap-4">
      {children}
    </div>
  );
}

export function CardSlot({ children }: { children: React.ReactNode }) {
  return <div className={CARD_WIDTH}>{children}</div>;
}
