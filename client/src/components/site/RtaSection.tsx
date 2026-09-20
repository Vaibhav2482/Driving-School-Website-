import { ArrowRight, FileText, MessageCircle } from "lucide-react";
import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo, useRtaServices } from "@/features/public/hooks";
import type { PublicRtaService } from "@/features/public/types";
import { formatInr } from "@/lib/format";
import { whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { CardGridSkeleton } from "./QueryStates";
import { Reveal } from "./Reveal";

/** Shown when the owner has not published any RTA services (or they could not be loaded). */
export function RtaContactCard() {
  const whatsapp = getWhatsappNumber(useBusinessInfo());
  return (
    <div className="rounded-2xl border border-line bg-surface p-7 sm:p-9">
      <h3 className="font-display text-2xl font-semibold text-ink">
        Need help with an RTA-related process?
      </h3>
      <p className="mt-3 max-w-xl text-muted">Contact our team for guidance.</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link to="/book?topic=rta" className={buttonStyles({ variant: "accent", size: "lg" })}>
          Enquire now
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        {whatsapp && (
          <a
            href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.rta)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: "secondary", size: "lg" })}
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            WhatsApp us
          </a>
        )}
      </div>
    </div>
  );
}

function RtaServiceCard({ service }: { service: PublicRtaService }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 sm:p-7">
      <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <FileText aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-5 font-display text-lg font-semibold text-ink">{service.name}</h3>
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
  const { data, isPending } = useRtaServices();

  if (isPending) return <CardGridSkeleton count={3} />;
  if (!data || data.length === 0) return <RtaContactCard />;

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
