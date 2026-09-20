import { MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

/** Closing call to action shown at the bottom of every major page. */
export function FinalCta({ title = "Ready to start learning?" }: { title?: string }) {
  const business = useBusinessInfo();
  const whatsapp = getWhatsappNumber(business);
  const phone = getPrimaryPhone(business);

  return (
    <section className="bg-canvas py-16 sm:py-20 lg:py-24">
      <Container>
        <Reveal className="relative overflow-hidden rounded-3xl bg-brand-900 px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -bottom-24 size-72 rounded-full bg-accent-600/90"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -bottom-40 size-72 rounded-full border-[28px] border-brand-800"
          />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-brand-100 sm:text-lg">
              Send us an enquiry, or call or message us on WhatsApp. We&apos;ll take it from there.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/book" className={buttonStyles({ variant: "accent", size: "lg" })}>
                Book your lesson
              </Link>
              {whatsapp && (
                <a
                  href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ variant: "inverse", size: "lg" })}
                >
                  <MessageCircle aria-hidden="true" className="size-5" />
                  WhatsApp us
                </a>
              )}
              {phone && (
                <a
                  href={telHref(phone)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-control px-4 text-base font-semibold text-white hover:underline"
                >
                  <Phone aria-hidden="true" className="size-5" />
                  {formatPhone(phone)}
                </a>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
