import { FileText, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router";
import { Seo } from "@/components/common/Seo";
import { buttonStyles } from "@/components/ui/button-styles";
import { FinalCta } from "@/components/site/FinalCta";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { RtaServicesList } from "@/components/site/RtaSection";
import { Section, SectionHeader } from "@/components/site/Section";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";

export function RtaServicesPage() {
  const business = useBusinessInfo();
  const whatsapp = getWhatsappNumber(business);
  const phone = getPrimaryPhone(business);

  return (
    <>
      <Seo
        title="RTA Services"
        description="RTA guidance from Sri Sai Balaji Driving School, Hyderabad. We guide you in all RTA works. Contact our team for help."
        path="/rta-services"
      />
      <PageHero
        eyebrow="RTA services"
        title="We guide you in all RTA works"
        description="RTA processes and paperwork can be confusing. Our team is here to guide you."
      />

      <Section tone="white">
        <SectionHeader
          eyebrow="How we can help"
          title="RTA guidance"
          description="Tell us what you need and our team will guide you through it."
        />
        <RtaServicesList />
      </Section>

      <Section tone="canvas">
        <SectionHeader eyebrow="Get in touch" title="Tell us what you need" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "Send an enquiry",
              text: "Tell us what you need help with and we'll get back to you.",
              action: (
                <Link
                  to="/book?topic=rta"
                  className={buttonStyles({ variant: "accent", size: "md" })}
                >
                  Enquire now
                </Link>
              ),
            },
            {
              icon: MessageCircle,
              title: "Message us on WhatsApp",
              text: "Ask your question and share what you need, right from your phone.",
              action: whatsapp && (
                <a
                  href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.rta)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ variant: "primary", size: "md" })}
                >
                  WhatsApp us
                </a>
              ),
            },
            {
              icon: Phone,
              title: "Call our team",
              text: "Prefer to talk it through? Give us a call.",
              action: phone && (
                <a
                  href={telHref(phone)}
                  className={buttonStyles({ variant: "secondary", size: "md" })}
                >
                  {formatPhone(phone)}
                </a>
              ),
            },
          ].map(({ icon: Icon, title, text, action }, index) => (
            <Reveal key={title} delay={index * 70} className="h-full">
              <div className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 sm:p-7">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-900 text-white">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-muted">{text}</p>
                <div className="mt-auto pt-6">{action}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <FinalCta title="Ready to get started?" />
    </>
  );
}
