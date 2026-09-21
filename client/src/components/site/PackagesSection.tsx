import { ArrowRight, MessageCircleQuestion, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { buttonStyles } from "@/components/ui/button-styles";
import { photos } from "@/config/photos";
import { sectionHref } from "@/config/public-nav";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo, usePackages } from "@/features/public/hooks";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { PackageCard } from "./PackageCard";
import { PhotoImage } from "./PhotoImage";
import { Reveal } from "./Reveal";

/**
 * Shown while no plan is published (we never display sample plans or prices): a confident invitation to talk to
 * the school, with the three ways to reach it.
 */
export function PackagesEmpty() {
  const business = useBusinessInfo();
  const phone = getPrimaryPhone(business);
  const whatsapp = getWhatsappNumber(business);

  return (
    <Reveal>
      <div className="relative isolate grid overflow-hidden bg-brand-950 text-white [clip-path:polygon(0_0,100%_0,100%_calc(100%-2.5rem),calc(100%-2.5rem)_100%,0_100%)] md:grid-cols-[1.1fr_0.9fr]">
        <span
          aria-hidden="true"
          className="absolute top-0 left-0 z-10 h-1.5 w-full bg-accent-500"
        />
        <div className="p-8 sm:p-12 lg:p-14">
          <span className="grid size-12 place-items-center rounded-full bg-accent-400/15 text-accent-300 ring-1 ring-accent-400/40">
            <MessageCircleQuestion aria-hidden="true" className="size-6" />
          </span>
          <h3 className="mt-6 font-display text-3xl leading-tight font-semibold sm:text-4xl">
            Looking for the right training plan?
          </h3>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-sand-300">
            Contact us and we&apos;ll help you choose.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={sectionHref("contact")}
              className={buttonStyles({ variant: "accent", size: "lg" })}
            >
              Get in touch
              <ArrowRight aria-hidden="true" className="size-4" />
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
            <p className="mt-6 flex items-center gap-2 text-sm text-sand-400">
              <Phone aria-hidden="true" className="size-4 text-accent-400" />
              Prefer to talk?{" "}
              <a href={telHref(phone)} className="font-semibold text-white hover:text-accent-300">
                {formatPhone(phone)}
              </a>
            </p>
          )}
        </div>
        <div aria-hidden="true" className="relative hidden min-h-72 md:block">
          <div className="absolute inset-0 bg-accent-500 [clip-path:polygon(12%_0,17%_0,5%_100%,0_100%)]" />
          <div className="absolute inset-0 [clip-path:polygon(19%_0,100%_0,100%_100%,7%_100%)]">
            <PhotoImage photo={photos.hands} />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/**
 * The list of training plans from the site content, or a "contact us" prompt while none are published.
 * `limit` shows only the first N (the home page).
 */
export function PackagesSection({ limit }: { limit?: number }) {
  const { data } = usePackages();

  if (data.length === 0) return <PackagesEmpty />;

  const shown = limit ? data.slice(0, limit) : data;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {shown.map((pkg, index) => (
        <Reveal key={pkg.slug} delay={index * 70} className="h-full">
          <PackageCard pkg={pkg} />
        </Reveal>
      ))}
    </div>
  );
}
