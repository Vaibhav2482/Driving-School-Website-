import { ArrowRight, Clock, MapPin, MessageCircle, Phone, UserRound } from "lucide-react";
import { Link } from "react-router";
import { Seo } from "@/components/common/Seo";
import { buttonStyles } from "@/components/ui/button-styles";
import { BranchesSection } from "@/components/site/BranchesSection";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { Section, SectionHeader } from "@/components/site/Section";
import { getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import {
  directionsHref,
  formatPhone,
  telHref,
  whatsappHref,
  WHATSAPP_MESSAGES,
} from "@/lib/contact";

const cardClass = "rounded-2xl border border-line bg-surface p-6 sm:p-7";
const iconClass = "grid size-11 shrink-0 place-items-center rounded-xl bg-brand-900 text-white";

export function ContactPage() {
  const business = useBusinessInfo();
  const whatsapp = getWhatsappNumber(business);
  const address = business.addressLines.join("\n");
  const directions = directionsHref({ address: business.addressLines.join(", ") });

  return (
    <>
      <Seo
        title="Contact"
        description="Contact Sri Sai Balaji Driving School in Kondapur and Hafeezpet, Hyderabad. Call, message us on WhatsApp, or send an enquiry."
        path="/contact"
      />
      <PageHero
        eyebrow="Contact"
        title="Talk to Sri Sai Balaji Driving School"
        description="Call us, message us on WhatsApp, or send an enquiry. We'd be happy to help."
      />

      <Section tone="white">
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal className="space-y-6">
            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <span className={iconClass}>
                  <Phone aria-hidden="true" className="size-5" />
                </span>
                <h2 className="font-display text-xl font-semibold text-ink">Call us</h2>
              </div>
              <ul className="mt-5 divide-y divide-line">
                {business.phones.map((phone) => (
                  <li key={phone.number}>
                    <a
                      href={telHref(phone.number)}
                      className="flex items-center justify-between gap-4 py-3.5 font-display text-xl font-semibold text-brand-900 transition-colors hover:text-accent-600"
                    >
                      {formatPhone(phone.number)}
                      {phone.whatsapp && (
                        <span className="rounded-full bg-success-50 px-2.5 py-0.5 font-sans text-xs font-medium text-success-700 ring-1 ring-success-200 ring-inset">
                          WhatsApp
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
              {whatsapp && (
                <a
                  href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonStyles({ variant: "primary", size: "lg", fullWidth: true })} mt-5`}
                >
                  <MessageCircle aria-hidden="true" className="size-5" />
                  Chat on WhatsApp
                </a>
              )}
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <span className={iconClass}>
                  <UserRound aria-hidden="true" className="size-5" />
                </span>
                <h2 className="font-display text-xl font-semibold text-ink">{business.name}</h2>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                {business.proprietor && (
                  <div className="flex gap-4">
                    <dt className="w-24 shrink-0 text-muted">Proprietor</dt>
                    <dd className="font-medium text-ink">{business.proprietor}</dd>
                  </div>
                )}
                {business.email && (
                  <div className="flex gap-4">
                    <dt className="w-24 shrink-0 text-muted">Email</dt>
                    <dd className="font-medium text-ink">
                      <a href={`mailto:${business.email}`} className="hover:text-accent-600">
                        {business.email}
                      </a>
                    </dd>
                  </div>
                )}
                <div className="flex gap-4">
                  <dt className="flex w-24 shrink-0 items-center gap-1.5 text-muted">
                    <Clock aria-hidden="true" className="size-4" />
                    Timings
                  </dt>
                  <dd className="font-medium text-ink">
                    {business.workingHours ??
                      "Please call or message us to confirm current timings."}
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>

          <Reveal delay={100} className="space-y-6">
            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <span className={iconClass}>
                  <MapPin aria-hidden="true" className="size-5" />
                </span>
                <h2 className="font-display text-xl font-semibold text-ink">Kondapur branch</h2>
              </div>
              <address className="mt-5 text-lg leading-relaxed whitespace-pre-line text-ink not-italic">
                {address}
              </address>
              {directions && (
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonStyles({ variant: "secondary", size: "md" })} mt-5`}
                >
                  Get directions
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </div>

            <div className="rounded-2xl bg-brand-900 p-6 text-white sm:p-7">
              <h2 className="font-display text-xl font-semibold">Prefer to write to us?</h2>
              <p className="mt-2 text-brand-100">
                Send an enquiry with your preferred plan and time. We&apos;ll contact you to take it
                forward.
              </p>
              <Link
                to="/book"
                className={`${buttonStyles({ variant: "accent", size: "lg" })} mt-6`}
              >
                Send an enquiry
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section tone="canvas">
        <SectionHeader eyebrow="Our branches" title="Kondapur and Hafeezpet" />
        <BranchesSection />
      </Section>
    </>
  );
}
