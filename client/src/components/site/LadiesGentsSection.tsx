import { UserRound } from "lucide-react";
import { Reveal } from "./Reveal";
import { Section, SectionHeader } from "./Section";

/**
 * Ladies & Gents training is a confirmed service. This section makes no claims about instructors,
 * batches or facilities that the client has not confirmed, and treats both groups identically.
 */
export function LadiesGentsSection() {
  return (
    <Section tone="white">
      <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <Reveal>
          <SectionHeader
            eyebrow="Ladies & Gents"
            title="Driving training for ladies and gents"
            description="Everyone learns at their own pace. Our training is open to ladies and gents, and we're happy to answer any questions before you begin."
            className="mb-0 sm:mb-0"
          />
        </Reveal>

        <Reveal delay={100}>
          <ul className="grid gap-4 sm:grid-cols-2">
            {["Ladies", "Gents"].map((group) => (
              <li
                key={group}
                className="rounded-2xl border border-line bg-canvas p-6 text-center transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift sm:p-8"
              >
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand-900 text-white">
                  <UserRound aria-hidden="true" className="size-8" />
                </span>
                <p className="mt-5 font-display text-2xl font-semibold text-ink">{group}</p>
                <p className="mt-1.5 text-sm text-muted">Training available</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
