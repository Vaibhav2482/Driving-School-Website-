import type { ReactNode } from "react";
import { Container } from "./Container";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Compact navy header band for inner pages. The title is the page's h1. */
export function PageHero({ eyebrow, title, description, actions }: PageHeroProps) {
  return (
    <div className="relative overflow-hidden bg-brand-950 text-white">
      {/* A faint road-line motif; decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-[28rem] rounded-full border border-white/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 size-[20rem] rounded-full border border-white/5"
      />
      <Container className="relative py-14 sm:py-16 lg:py-20">
        {eyebrow && (
          <p className="mb-4 flex items-center gap-2.5 text-xs font-semibold tracking-[0.18em] text-accent-300 uppercase">
            <span aria-hidden="true" className="h-px w-6 bg-current" />
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl font-display text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl">
          {title}
        </h1>
        {description && (
          <div className="mt-5 max-w-2xl text-base leading-relaxed text-brand-100 sm:text-lg">
            {description}
          </div>
        )}
        {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
      </Container>
    </div>
  );
}
