import { ArrowRight } from "lucide-react";
import { photos, type Photo } from "@/config/photos";
import { sectionHref } from "@/config/public-nav";
import { PhotoImage } from "./PhotoImage";
import { Reveal } from "./Reveal";
import { Section, SectionHeader } from "./Section";

const GROUPS: { label: string; photo: Photo }[] = [
  { label: "Ladies", photo: photos.ladies },
  { label: "Gents", photo: photos.gents },
];

/**
 * Ladies & Gents training is a confirmed service. This section makes no claims about instructors,
 * batches or facilities that the client has not confirmed, and treats both groups identically.
 */
export function LadiesGentsSection() {
  return (
    <Section tone="navy" id="training" slant>
      <SectionHeader
        tone="navy"
        index="02"
        eyebrow="Ladies & Gents"
        title="Driving training for ladies and gents"
        description="Everyone learns at their own pace. Our training is open to ladies and gents, and we're happy to answer any questions before you begin."
      />

      <ul className="grid gap-6 sm:grid-cols-2 sm:gap-8">
        {GROUPS.map(({ label, photo }, index) => (
          <li key={label}>
            <Reveal delay={index * 100}>
              <div className="group relative isolate aspect-[4/5] overflow-hidden bg-brand-900 [clip-path:polygon(0_0,100%_0,100%_calc(100%-3rem),calc(100%-3rem)_100%,0_100%)] sm:aspect-[5/6] lg:aspect-[4/4.6]">
                <PhotoImage
                  photo={photo}
                  className="transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/35 to-transparent"
                />

                {/* Red base bar along the bottom edge. */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-2 w-[calc(100%-3rem)] bg-accent-500"
                />

                <p className="absolute top-0 left-0 bg-accent-500 py-2 pr-7 pl-5 font-display text-sm font-bold tracking-[0.2em] text-white uppercase italic [clip-path:polygon(0_0,100%_0,calc(100%-14px)_100%,0_100%)]">
                  Training available
                </p>

                <div className="absolute inset-x-0 bottom-0 p-7 pb-9 sm:p-9 sm:pb-11">
                  <h3 className="font-display text-6xl leading-none font-extrabold text-white sm:text-7xl">
                    {label}
                  </h3>
                  <a
                    href={sectionHref("contact")}
                    className="mt-4 inline-flex items-center gap-2 font-display text-lg font-bold tracking-wider text-white uppercase italic transition-colors hover:text-accent-300"
                  >
                    Enquire for {label.toLowerCase()} training
                    <ArrowRight aria-hidden="true" className="size-4 text-accent-400" />
                  </a>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
