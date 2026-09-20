import { MessageCircle, Phone } from "lucide-react";
import { Seo } from "@/components/common/Seo";
import { buttonStyles } from "@/components/ui/button-styles";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { EnquiryForm } from "@/features/enquiry/EnquiryForm";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";

const NEXT_STEPS = [
  "We receive your enquiry.",
  "We contact you on the number you gave us.",
  "We talk it through and arrange the details together.",
];

export function BookPage() {
  const business = useBusinessInfo();
  const whatsapp = getWhatsappNumber(business);
  const phone = getPrimaryPhone(business);

  return (
    <>
      <Seo
        title="Book Your Driving Lesson"
        description="Send an enquiry to Sri Sai Balaji Driving School, Hyderabad. Tell us your preferred plan, date and time, and we'll contact you."
        path="/book"
      />
      <PageHero
        eyebrow="Book a lesson"
        title="Book your driving lesson"
        description="Send us your details and preferred time. We'll contact you to arrange your lesson."
      />

      <Section tone="canvas" className="!pt-10 sm:!pt-14">
        <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-8">
            <EnquiryForm />
          </div>

          <aside aria-label="Other ways to reach us" className="space-y-6">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="font-display text-lg font-semibold text-ink">Prefer to talk?</h2>
              <p className="mt-2 text-sm text-muted">Call or message us directly.</p>
              <div className="mt-5 grid gap-3">
                {phone && (
                  <a
                    href={telHref(phone)}
                    className={buttonStyles({ variant: "secondary", size: "md", fullWidth: true })}
                  >
                    <Phone aria-hidden="true" className="size-4" />
                    {formatPhone(phone)}
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyles({ variant: "primary", size: "md", fullWidth: true })}
                  >
                    <MessageCircle aria-hidden="true" className="size-4" />
                    WhatsApp us
                  </a>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="font-display text-lg font-semibold text-ink">What happens next</h2>
              <ol className="mt-4 space-y-4">
                {NEXT_STEPS.map((step, index) => (
                  <li key={step} className="flex gap-3.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-900 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-sm text-ink">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                This form sends an enquiry. Your lesson is confirmed only after we have spoken to
                you.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
