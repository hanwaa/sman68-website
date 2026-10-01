import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  lead?: string;
  action?: ReactNode;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  lead,
  action,
  align = "left",
  dark = false,
  className,
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow && (
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.2em] mb-4",
              dark ? "text-brand-lime" : "text-brand-green"
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2 className={cn("font-display display-heading", dark ? "text-white" : "text-ink")}>
          {title}
        </h2>
        {lead && (
          <p
            className={cn(
              "mt-4 text-base md:text-lg leading-relaxed",
              dark ? "text-white/65" : "text-muted"
            )}
          >
            {lead}
          </p>
        )}
      </div>

      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
