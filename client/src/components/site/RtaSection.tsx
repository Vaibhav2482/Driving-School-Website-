import { ArrowRight, FileText } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { buttonStyles } from "@/components/ui/button-styles";
import { sectionHref } from "@/config/public-nav";
import { getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo, useRtaServices } from "@/features/public/hooks";
import type { PublicRtaService } from "@/features/public/types";
import { formatInr } from "@/lib/format";
import { whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { Reveal } from "./Reveal";

/** Shown when the owner has not published any RTA services (or they could not be loaded). */
export function RtaContactCard() {
  const whatsapp = getWhatsappNumber(useBusinessInfo());
  return (
    <div className="relative bg-white/[0.06] p-8 ring-1 ring-white/10 [clip-path:polygon(0_0,100%_0,100%_calc(100%-2.5rem),calc(100%-2.5rem)_100%,0_100%)] sm:p-12">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-accent-500" />
      <h3 className="font-display text-3xl font-semibold text-white sm:text-4xl">
        Need help with an RTA-related process?
      </h3>
      <p className="mt-4 max-w-xl text-lg text-sand-300">Contact our team for guidance.</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <a
          href={sectionHref("contact")}
          className={buttonStyles({ variant: "accent", size: "lg" })}
        >
          Enquire now
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
        {whatsapp && (
          <a
            href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.rta)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: "whatsapp", size: "lg" })}
          >
            <WhatsAppIcon className="size-5" />
            WhatsApp us
          </a>
        )}
      </div>
    </div>
  );
}

function RtaServiceCard({ service }: { service: PublicRtaService }) {
  return (
    <article className="flex h-full flex-col border-x border-t-4 border-b border-line border-t-accent-500 bg-surface p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-8">
      <span className="grid size-12 place-items-center bg-brand-950 text-accent-300">
        <FileText aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-6 font-display text-xl font-semibold text-ink">{service.name}</h3>
      {service.description && (
        <p className="mt-2 text-sm leading-relaxed text-muted">{service.description}</p>
      )}

      {service.requiredDocuments.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">
            Documents needed
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm marker:text-sand-400">
            {service.requiredDocuments.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </div>
      )}

      {service.pricePaise !== null && service.pricePaise > 0 && (
        <p className="mt-auto pt-6 text-sm text-muted">
          Fee: <span className="font-semibold text-ink">{formatInr(service.pricePaise)}</span>
        </p>
      )}
    </article>
  );
}

/**
 * The owner-managed list of RTA services from `GET /public/rta-services`. We never invent service
 * names: with none published (or on error) a simple "contact us" card is shown instead.
 */
export function RtaServicesList() {
  const { data } = useRtaServices();

  if (data.length === 0) return <RtaContactCard />;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((service, index) => (
        <Reveal key={service.slug} delay={index * 60} className="h-full">
          <RtaServiceCard service={service} />
        </Reveal>
      ))}
    </div>
  );
}
