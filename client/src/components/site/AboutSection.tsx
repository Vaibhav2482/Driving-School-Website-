import { ArrowRight, Check, Phone, ShieldCheck } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { photos } from "@/config/photos";
import { sectionHref } from "@/config/public-nav";
import { SITE_NAME } from "@/config/site";
import { getPrimaryPhone } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { formatPhone, telHref } from "@/lib/contact";
import { PhotoImage } from "./PhotoImage";
import { Reveal } from "./Reveal";
import { Section, SectionHeader } from "./Section";
import { WhyChooseUs } from "./WhyChooseUs";

/**
 * About the school. Only facts from the business card are stated: the services, the two branches, the recognition
 * line and the proprietor. There are no years, student counts, ratings or pass rates.
 */
export function AboutSection() {
  const business = useBusinessInfo();
  const phone = getPrimaryPhone(business);

  return (
    <Section tone="canvas" id="about" className="relative">
      <div className="relative grid items-center gap-16 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        {/* A pale slanted band behind the content, for depth. */}
        <div
          aria-hidden="true"
          className="absolute -inset-y-24 right-[-14%] hidden w-[40%] -skew-x-12 bg-white lg:block"
        />
        {/* Photographs, cut on the racing diagonal, with the recognition badge. */}
        <Reveal>
          <div className="relative mx-auto max-w-xl pb-16 lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-4 translate-y-4 bg-accent-500 [clip-path:polygon(0_0,94%_0,100%_100%,6%_100%)] sm:translate-x-6 sm:translate-y-6"
            />
            <div className="relative aspect-[5/6] [clip-path:polygon(0_0,94%_0,100%_100%,6%_100%)]">
              <PhotoImage photo={photos.lesson} />
            </div>

            <div className="absolute right-0 bottom-0 w-[52%] bg-white p-1.5 shadow-lift [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)]">
              <div className="aspect-[4/3] [clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)]">
                <PhotoImage photo={photos.mirror} />
              </div>
            </div>

            {business.recognition && (
              <div className="absolute bottom-6 left-0 flex max-w-[15rem] items-center gap-3 border-l-4 border-accent-500 bg-brand-950 py-3 pr-5 pl-4 text-white shadow-overlay sm:bottom-2 sm:left-[-1.25rem]">
                <ShieldCheck aria-hidden="true" className="size-7 shrink-0 text-accent-400" />
                <p className="font-display text-lg leading-[1.05] font-bold">
                  {business.recognition}
                </p>
              </div>
            )}
          </div>
        </Reveal>

        {/* Words. */}
        <div className="relative">
          <span
            aria-hidden="true"
            className="text-outline-accent pointer-events-none absolute -top-14 -left-2 font-display text-[7.5rem] leading-none font-extrabold opacity-25 select-none sm:text-[10rem]"
          >
            About
          </span>

          <div className="relative">
            <SectionHeader
              index="01"
              eyebrow="About us"
              title="A driving school built around you"
              className="mb-7 sm:mb-8"
            />

            <Reveal>
              <p className="max-w-xl text-lg leading-relaxed text-sand-700">
                {SITE_NAME} trains ladies and gents in Kondapur and Hafeezpet, Hyderabad. With house
                pickup and drop and full RTA guidance, learning to drive stays simple, from your
                first lesson to the paperwork.
              </p>

              <ul className="mt-8 grid gap-3">
                {business.confirmedServices.map((service) => (
                  <li key={service} className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="grid h-8 w-9 shrink-0 place-items-center bg-accent-500 text-white [clip-path:polygon(22%_0,100%_0,78%_100%,0_100%)]"
                    >
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                    <span className="font-display text-2xl font-bold text-brand-950">
                      {service}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-6 border-t border-line-strong pt-8">
                {business.proprietor && (
                  <div className="border-l-4 border-accent-500 pl-4">
                    <p className="text-xs font-semibold tracking-[0.3em] text-sand-600 uppercase">
                      Proprietor
                    </p>
                    <p className="mt-1 font-display text-3xl leading-none font-extrabold text-brand-950">
                      {business.proprietor}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <a
                    href={sectionHref("contact")}
                    className={buttonStyles({ variant: "accent", size: "lg" })}
                  >
                    Book your lesson
                    <ArrowRight aria-hidden="true" className="size-5" />
                  </a>
                  {phone && (
                    <a
                      href={telHref(phone)}
                      className={buttonStyles({ variant: "secondary", size: "lg" })}
                    >
                      <Phone aria-hidden="true" className="size-4" />
                      {formatPhone(phone)}
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Why learners choose us. */}
      <div className="relative mt-24 lg:mt-32">
        <div className="mb-2 flex items-center gap-4">
          <h3 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">
            Why learners choose us
          </h3>
          <span
            aria-hidden="true"
            className="h-1 flex-1 bg-gradient-to-r from-accent-500 to-transparent"
          />
        </div>
        <WhyChooseUs columns={3} />
      </div>
    </Section>
  );
}
