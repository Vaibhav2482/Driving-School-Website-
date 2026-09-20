import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

export type SectionTone = "canvas" | "white" | "navy";

const tones: Record<SectionTone, string> = {
  canvas: "bg-canvas text-ink",
  white: "bg-surface text-ink",
  navy: "bg-brand-950 text-white",
};

interface SectionProps extends ComponentProps<"section"> {
  tone?: SectionTone;
  containerClassName?: string;
}

/** A full-width band with the site's standard vertical rhythm. */
export function Section({
  tone = "canvas",
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("scroll-mt-20 py-16 sm:py-20 lg:py-28", tones[tone], className)}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  tone?: SectionTone;
  align?: "left" | "center";
  /** Rendered to the right of the heading on wide screens (e.g. a "view all" link). */
  action?: ReactNode;
  className?: string;
}

/** Eyebrow + large heading + lead paragraph. The heading is an h2. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  tone = "canvas",
  align = "left",
  action,
  className,
}: SectionHeaderProps) {
  const dark = tone === "navy";
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-6 sm:mb-14 md:flex-row md:items-end md:justify-between",
        align === "center" &&
          "items-center text-center md:flex-col md:items-center md:justify-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <p
            className={cn(
              "mb-3 flex items-center gap-2.5 text-xs font-semibold tracking-[0.18em] uppercase",
              align === "center" && "justify-center",
              dark ? "text-accent-300" : "text-accent-600",
            )}
          >
            <span aria-hidden="true" className="h-px w-6 bg-current" />
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            "font-display text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]",
            dark ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description && (
          <div
            className={cn(
              "mt-4 text-base leading-relaxed sm:text-lg",
              dark ? "text-brand-100" : "text-muted",
            )}
          >
            {description}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
