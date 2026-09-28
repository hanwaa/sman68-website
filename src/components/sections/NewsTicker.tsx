import Link from "next/link";
import { Zap } from "lucide-react";
import { getNews } from "@/lib/content-server";

type TickerItem = {
  category: string;
  title: string;
  date: string;
  href: string;
};

function Track({ items, hidden = false }: { items: TickerItem[]; hidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center font-display"
      aria-hidden={hidden || undefined}
    >
      {items.map((item, i) => (
        <Link
          key={`${item.title}-${i}`}
          href={item.href}
          tabIndex={hidden ? -1 : undefined}
          className="group mr-3 flex items-center"
        >
          <span className="flex items-center gap-2.5 rounded-full border border-line bg-white px-3 py-1.5 shadow-card transition-colors duration-200 ease-out group-hover:border-brand-leaf/40 group-hover:shadow-card-hover sm:gap-3 sm:px-4 sm:py-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-green">
              {item.category}
            </span>
            <span className="text-[13px] sm:text-sm font-medium text-ink transition-colors group-hover:text-brand-green">
              {item.title}
            </span>
            <span className="hidden min-[480px]:inline text-[11px] sm:text-xs text-muted tabular-nums">{item.date}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export default async function NewsTicker() {
  const items: TickerItem[] = (await getNews()).slice(0, 6).map((item) => ({
    category: item.category,
    title: item.title,
    date: item.dateLabel,
    href: `/berita?berita=${item.slug}`,
  }));

  if (items.length === 0) return null;

  return (
    <section className="relative bg-white border-b border-line" aria-label="Berita terbaru">
      <div className="flex items-stretch">
        <span className="relative z-20 flex shrink-0 items-center gap-1.5 border-r border-line bg-white pl-4 pr-3 sm:pl-8 sm:pr-5">
          <Zap size={13} className="text-brand-green" aria-hidden="true" />
          <span className="hidden min-[480px]:inline text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-green">
            Terkini
          </span>
        </span>
        <div className="marquee relative flex-1 overflow-hidden">
          <span
            className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-white via-white/70 to-transparent"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-white via-white/70 to-transparent"
            aria-hidden="true"
          />
          <div className="marquee-track flex w-max py-2.5">
            <Track items={items} />
            <Track items={items} hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
