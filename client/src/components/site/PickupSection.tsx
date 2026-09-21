import { ArrowRight, Car, Check, House } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { photos } from "@/config/photos";
import { sectionHref } from "@/config/public-nav";
import { PhotoImage } from "./PhotoImage";
import { Reveal } from "./Reveal";
import { Section, SectionHeader } from "./Section";

const ROUTE = [
  { icon: House, label: "Your home" },
  { icon: Car, label: "Your lesson" },
  { icon: House, label: "Back home" },
] as const;

/**
 * House pickup & dropping is a confirmed service. The service area is NOT confirmed, so this section
 * deliberately does not name one and points people to the enquiry form to check their location.
 */
export function PickupSection() {
  return (
    <Section tone="navy" id="pickup" slant>
      <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
        <Reveal>
          <SectionHeader
            tone="navy"
            index="04"
            eyebrow="Pickup & drop"
            title="Convenient house pickup & drop"
            description="Getting to a lesson shouldn't be one more thing to organise. We offer house pickup and dropping, so you can focus on learning to drive."
            className="mb-8 sm:mb-8"
          />
          <ul className="space-y-4 text-lg text-sand-100">
            {[
              "Pickup and drop available for learners",
              "Tell us your location when you enquire",
              "We'll let you know what we can arrange for your area",
            ].map((point) => (
              <li key={point} className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="grid h-7 w-8 shrink-0 place-items-center bg-accent-500 text-white [clip-path:polygon(22%_0,100%_0,78%_100%,0_100%)]"
                >
                  <Check className="size-4" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <a
            href={sectionHref("contact")}
            className={`${buttonStyles({ variant: "accent", size: "lg" })} mt-10`}
          >
            Check availability
            <ArrowRight aria-hidden="true" className="size-5" />
          </a>
        </Reveal>

        <Reveal delay={120}>
          {/* The photograph, cut on the racing diagonal with a red and a white stripe. */}
          <div className="relative mx-auto aspect-[4/5] w-full max-w-lg lg:max-w-none">
            <div className="absolute inset-0 bg-accent-500 [clip-path:polygon(14%_0,20%_0,6%_100%,0_100%)]" />
            <div className="absolute inset-0 bg-white [clip-path:polygon(22%_0,23.5%_0,9.5%_100%,8%_100%)]" />
            <div className="absolute inset-0 [clip-path:polygon(25%_0,100%_0,100%_100%,11%_100%)]">
              <PhotoImage photo={photos.mirror} />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-transparent to-transparent"
              />
            </div>

            {/* The service in one glance: home, lesson, home. */}
            <div className="absolute right-4 bottom-4 left-[30%] bg-brand-950/90 p-4 backdrop-blur sm:right-6 sm:bottom-6">
              <ol className="flex items-center text-[11px] font-semibold tracking-[0.14em] text-white uppercase">
                {ROUTE.map(({ icon: Icon, label }, index) => (
                  <li key={index} className="contents">
                    <span className="flex flex-col items-center gap-2 text-center">
                      <span className="grid size-9 place-items-center bg-accent-500">
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      {label}
                    </span>
                    {index < ROUTE.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="mx-2 mb-6 h-px flex-1 border-t-2 border-dashed border-accent-400"
                      />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
