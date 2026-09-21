import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "./Container";

export type SectionTone = "canvas" | "white" | "navy";

const tones: Record<SectionTone, string> = {
  canvas: "bg-canvas text-ink",
  white: "bg-surface text-ink",
  // A faint gold glow in one corner and a hairline along the top give the dark bands depth.
  navy: "grain relative bg-brand-950 bg-[radial-gradient(60rem_28rem_at_88%_-8%,rgb(229_37_27/0.16),transparent_70%),radial-gradient(40rem_24rem_at_0%_105%,rgb(229_37_27/0.08),transparent_70%)] text-white before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent-500/50 before:to-transparent before:content-['']",
};

interface SectionProps extends ComponentProps<"section"> {
  tone?: SectionTone;
  containerClassName?: string;
  /** Cut the top and bottom edges on the racing diagonal. Use only between two light sections. */
  slant?: boolean;
}

/** A full-width band with the site's standard vertical rhythm. */
export function Section({
  tone = "canvas",
  className,
  containerClassName,
  slant = false,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "overflow-x-clip py-24 sm:py-28 lg:py-36",
        tones[tone],
        slant &&
          "[--cut:1.75rem] [clip-path:polygon(0_var(--cut),100%_0,100%_calc(100%-var(--cut)),0_100%)] lg:[--cut:4rem]",
        className,
      )}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

/** The small gold label above a heading, with a hairline. */
export function Eyebrow({
  children,
  dark = false,
  center = false,
  className,
}: {
  children: ReactNode;
  dark?: boolean;
  center?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-xs font-semibold tracking-[0.22em] uppercase",
        center && "justify-center",
        dark ? "text-accent-300" : "text-accent-700",
        className,
      )}
    >
      <span aria-hidden="true" className="h-px w-8 bg-current opacity-70" />
      {children}
      {center && <span aria-hidden="true" className="h-px w-8 bg-current opacity-70" />}
    </p>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  /** Editorial section number shown before the eyebrow, e.g. "01". */
  index?: string;
  title: string;
  description?: ReactNode;
  tone?: SectionTone;
  align?: "left" | "center";
  /** Rendered to the right of the heading on wide screens (e.g. a "view all" link). */
  action?: ReactNode;
  className?: string;
}

/** Eyebrow + large serif heading + lead paragraph. The heading is an h2. */
export function SectionHeader({
  eyebrow,
  index,
  title,
  description,
  tone = "canvas",
  align = "left",
  action,
  className,
}: SectionHeaderProps) {
  const dark = tone === "navy";
  const center = align === "center";
  return (
    <div
      className={cn(
        "mb-12 flex flex-col gap-6 sm:mb-16 md:flex-row md:items-end md:justify-between",
        center && "items-center text-center md:flex-col md:items-center md:justify-center",
        className,
      )}
    >
      <div className={cn("max-w-3xl", center && "mx-auto")}>
        {eyebrow && (
          <Eyebrow dark={dark} center={center} className="mb-5">
            {index && (
              <span className="font-display text-lg tracking-normal normal-case italic">
                {index}
              </span>
            )}
            {eyebrow}
          </Eyebrow>
        )}
        <h2
          className={cn(
            "font-display text-[2.25rem] leading-[1.05] font-semibold text-balance sm:text-6xl lg:text-[4.25rem]",
            dark ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description && (
          <div
            className={cn(
              "mt-5 text-base leading-relaxed sm:text-lg",
              dark ? "text-sand-200" : "text-muted",
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
