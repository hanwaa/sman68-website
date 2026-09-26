import Link from "next/link";
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
          <span className="flex items-center gap-3 rounded-xl bg-brand-mist/70 px-4 py-2 transition-colors group-hover:bg-brand-mist">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-green" aria-hidden="true" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-green">
                {item.category}
              </span>
            </span>
            <span className="text-sm text-ink transition-colors group-hover:text-ink/75">
              {item.title}
            </span>
            <span className="text-xs text-muted">{item.date}</span>
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

  return (
    <section className="relative bg-white py-2" aria-label="Berita terbaru">
      <div className="marquee relative overflow-hidden">
        <span
          className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-white via-white/80 to-transparent"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-white via-white/80 to-transparent"
          aria-hidden="true"
        />
          <div className="marquee-track flex w-max">
            <Track items={items} />
            <Track items={items} hidden />
          </div>
      </div>
    </section>
  );
}
