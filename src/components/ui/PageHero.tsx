import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageHeroProps = {
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
  className?: string;
};

export default function PageHero({ title, lead, children, className }: PageHeroProps) {
  return (
    <div className={cn("relative bg-brand-pine overflow-hidden", className)}>
      <div className="absolute inset-0 pattern-grid opacity-60" aria-hidden="true" />
      <div
        className="absolute -top-28 -right-28 w-80 h-80 rounded-full bg-brand-leaf/10"
        aria-hidden="true"
      />

      <div className="container-custom relative py-16 md:py-20">
        <h1
          className="font-display font-extrabold text-4xl md:text-5xl text-white text-balance"
          style={{ letterSpacing: "-0.008em", lineHeight: 1.12 }}
        >
          {title}
        </h1>
        {lead && (
          <p className="text-white/65 text-lg max-w-2xl mt-4 leading-relaxed">{lead}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  );
}
