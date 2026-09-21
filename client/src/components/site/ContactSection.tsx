import { Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { buttonStyles } from "@/components/ui/button-styles";
import { photos } from "@/config/photos";
import { EnquiryForm } from "@/features/enquiry/EnquiryForm";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { BranchesSection } from "./BranchesSection";
import { PhotoImage } from "./PhotoImage";
import { Reveal } from "./Reveal";
import { Section, SectionHeader } from "./Section";

/**
 * The finale of the page: one big number to call, the branches, and a short enquiry form. The form hands the visitor
 * to WhatsApp with their details filled in, so no server is involved.
 */
export function ContactSection() {
  const business = useBusinessInfo();
  const whatsapp = getWhatsappNumber(business);
  const primary = getPrimaryPhone(business);
  const others = business.phones.filter((phone) => phone.number !== primary);

  return (
    <Section tone="navy" id="contact" className="relative">
      {/* A road photograph fading into the black along the top. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[34rem] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-30"
      >
        <PhotoImage photo={photos.sunset} />
      </div>

      <div className="relative">
        <SectionHeader
          tone="navy"
          index="08"
          eyebrow="Book your lesson"
          title="Let's get you on the road"
          description="Tell us what suits you and we'll reply on WhatsApp to arrange your lesson. Prefer to talk? Call us any time."
        />

        <div className="grid items-start gap-x-20 gap-y-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:col-start-1 lg:row-start-1">
            <Reveal>
              <div className="border-l-4 border-accent-500 pl-6">
                <p className="text-xs font-semibold tracking-[0.3em] text-sand-400 uppercase">
                  Call or WhatsApp
                </p>
                {primary && (
                  <a
                    href={telHref(primary)}
                    className="mt-2 block font-display text-[3.4rem] leading-none font-extrabold tracking-wide text-white transition-colors hover:text-accent-400 sm:text-[4.5rem]"
                  >
                    {formatPhone(primary)}
                  </a>
                )}

                <div className="mt-7 flex flex-wrap gap-3">
                  {whatsapp && (
                    <a
                      href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonStyles({ variant: "whatsapp", size: "lg" })}
                    >
                      <WhatsAppIcon className="size-5" />
                      Chat on WhatsApp
                    </a>
                  )}
                  {primary && (
                    <a
                      href={telHref(primary)}
                      className={buttonStyles({ variant: "inverse", size: "lg" })}
                    >
                      <Phone aria-hidden="true" className="size-5" />
                      Call now
                    </a>
                  )}
                </div>

                {others.length > 0 && (
                  <p className="mt-6 text-sand-300">
                    Other numbers:{" "}
                    {others.map((phone, index) => (
                      <span key={phone.number}>
                        {index > 0 && <span className="px-2 text-sand-500">/</span>}
                        <a
                          href={telHref(phone.number)}
                          className="font-semibold text-white hover:text-accent-300"
                        >
                          {formatPhone(phone.number)}
                        </a>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </Reveal>
          </div>

          <Reveal
            delay={100}
            className="lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <div className="relative bg-white p-7 text-ink shadow-overlay [clip-path:polygon(0_0,calc(100%-40px)_0,100%_40px,100%_100%,40px_100%,0_calc(100%-40px))] sm:p-11">
              <span
                aria-hidden="true"
                className="absolute top-0 left-0 h-1.5 w-[calc(100%-40px)] bg-accent-500"
              />
              <h3 className="font-display text-4xl font-extrabold text-brand-950 sm:text-5xl">
                Send an enquiry
              </h3>
              <p className="mt-2 mb-8 text-muted">
                Just your name and number to start. We&apos;ll do the rest.
              </p>
              <EnquiryForm />
            </div>
          </Reveal>

          <div className="lg:col-start-1 lg:row-start-2">
            <BranchesSection />
          </div>
        </div>
      </div>
    </Section>
  );
}
