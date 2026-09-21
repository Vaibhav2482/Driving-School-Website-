import { ArrowRight, Phone, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { buttonStyles } from "@/components/ui/button-styles";
import { photos } from "@/config/photos";
import { sectionHref } from "@/config/public-nav";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { Container } from "./Container";
import { PhotoImage } from "./PhotoImage";

/**
 * Home hero: bright silver, a huge slanted headline, and a road photograph cut on a racing diagonal with two
 * stripes (red and carbon) along its edge. Claims are limited to confirmed facts (no "best", "No. 1", ratings or
 * pass rates).
 */
export function HomeHero() {
  const business = useBusinessInfo();
  const whatsapp = getWhatsappNumber(business);
  const phone = getPrimaryPhone(business);

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-white via-sand-50 to-sand-200 text-brand-950">
      {/* Diagonal photo panel with racing stripes: large screens. */}
      <div aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 hidden w-[50%] lg:block">
        <div className="absolute inset-0 bg-accent-500 [clip-path:polygon(19%_0,24%_0,5%_100%,0_100%)]" />
        <div className="absolute inset-0 bg-brand-950 [clip-path:polygon(25%_0,26.5%_0,7.5%_100%,6%_100%)]" />
        <div className="absolute inset-0 [clip-path:polygon(27.5%_0,100%_0,100%_100%,8%_100%)]">
          <PhotoImage photo={photos.hero} priority />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/40 via-transparent to-transparent" />
        </div>
      </div>

      <Container className="grid min-h-[calc(100svh-69px)] items-center py-14 sm:py-20 lg:min-h-[calc(100svh-77px)] lg:grid-cols-[1.3fr_0.7fr] lg:py-24">
        <div className="animate-fade-in">
          <p className="inline-flex items-center gap-2.5 border-l-4 border-accent-500 bg-white py-1.5 pr-4 pl-3 text-xs font-bold tracking-[0.16em] text-brand-950 uppercase shadow-card">
            {business.recognition ? (
              <>
                <ShieldCheck aria-hidden="true" className="size-4 text-accent-600" />
                {business.recognition}
              </>
            ) : (
              "Kondapur · Hafeezpet · Hyderabad"
            )}
          </p>

          <h1 className="mt-6 text-[3.6rem] leading-[0.88] sm:text-[6rem] lg:text-[6.75rem]">
            Learn to drive.
            <br />
            Drive with <span className="text-accent-gradient pr-2">confidence.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-sand-700 sm:text-xl">
            Professional driving training in Kondapur and Hafeezpet, for ladies and gents, with
            convenient house pickup and drop options.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={sectionHref("contact")}
              className={buttonStyles({ variant: "accent", size: "lg" })}
            >
              Book your lesson
              <ArrowRight aria-hidden="true" className="size-5" />
            </a>
            {whatsapp && (
              <a
                href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: "whatsapp", size: "lg" })}
              >
                <WhatsAppIcon className="size-5" />
                WhatsApp us
              </a>
            )}
          </div>

          {phone && (
            <p className="mt-7 flex items-center gap-2 text-base text-sand-700">
              <Phone aria-hidden="true" className="size-4 text-accent-600" />
              Prefer to talk?
              <a
                href={telHref(phone)}
                className="font-bold text-brand-950 underline-offset-4 hover:text-accent-600 hover:underline"
              >
                Call {formatPhone(phone)}
              </a>
            </p>
          )}
        </div>
      </Container>

      {/* Phones and tablets: the same photo as a slanted banner under the text. */}
      <div aria-hidden="true" className="relative h-56 sm:h-72 lg:hidden">
        <div className="absolute inset-0 bg-accent-500 [clip-path:polygon(0_22%,100%_0,100%_100%,0_100%)]" />
        <div className="absolute inset-0 [clip-path:polygon(0_28%,100%_6%,100%_100%,0_100%)]">
          <PhotoImage photo={photos.hero} />
        </div>
      </div>
    </section>
  );
}
