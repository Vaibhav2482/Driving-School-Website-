import { ArrowRight } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { photos } from "@/config/photos";
import { sectionHref } from "@/config/public-nav";
import { Container } from "./Container";
import { PhotoImage } from "./PhotoImage";
import { Reveal } from "./Reveal";

/**
 * A full-bleed, cinematic pause in the page: golden-hour road, one line of serif italic, one call to action.
 * It makes no claims, so there is nothing here that needs the school's confirmation.
 */
export function StatementBand() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-950 py-28 text-white sm:py-36 lg:py-44">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <PhotoImage photo={photos.sunset} />
        <div className="absolute inset-0 bg-brand-950/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950 via-transparent to-brand-950" />
      </div>
      <Container>
        <Reveal className="mx-auto max-w-4xl text-center">
          <span aria-hidden="true" className="mx-auto block h-px w-16 bg-accent-400" />
          <p className="mt-10 font-display text-4xl leading-[1.12] font-medium italic sm:text-6xl lg:text-7xl">
            Every confident driver
            <br />
            began with a <span className="text-accent-gradient">first lesson.</span>
          </p>
          <a
            href={sectionHref("contact")}
            className={`${buttonStyles({ variant: "accent", size: "lg" })} mt-12`}
          >
            Book your first lesson
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </Reveal>
      </Container>
    </section>
  );
}
