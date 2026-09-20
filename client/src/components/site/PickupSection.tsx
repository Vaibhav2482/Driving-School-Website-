import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { PickupVisual } from "./PickupVisual";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

/**
 * House pickup & dropping is a confirmed service. The service area is NOT confirmed, so this section
 * deliberately does not name one and points people to the enquiry form to check their location.
 */
export function PickupSection() {
  return (
    <Section tone="navy" aria-labelledby="pickup-heading">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <p className="mb-3 flex items-center gap-2.5 text-xs font-semibold tracking-[0.18em] text-accent-300 uppercase">
            <span aria-hidden="true" className="h-px w-6 bg-current" />
            Pickup &amp; drop
          </p>
          <h2
            id="pickup-heading"
            className="font-display text-3xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]"
          >
            Convenient house pickup &amp; drop
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">
            Getting to a lesson shouldn&apos;t be one more thing to organise. We offer house pickup
            and dropping, so you can focus on learning to drive.
          </p>
          <ul className="mt-7 space-y-3.5 text-brand-50">
            {[
              "Pickup and drop available for learners",
              "Tell us your location when you enquire",
              "We'll let you know what we can arrange for your area",
            ].map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-signal-400 text-brand-950">
                  <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <Link
            to="/book?pickup=1"
            className={`${buttonStyles({ variant: "accent", size: "lg" })} mt-9`}
          >
            Check availability
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Reveal>

        <Reveal delay={120}>
          <PickupVisual className="mx-auto w-full max-w-lg rounded-3xl ring-1 ring-white/10" />
        </Reveal>
      </div>
    </Section>
  );
}
