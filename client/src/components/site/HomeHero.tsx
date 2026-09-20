import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { Container } from "./Container";
import { HeroVisual } from "./HeroVisual";

/**
 * Home hero. Claims are limited to confirmed facts (no "best", "No. 1" or pass-rate statements).
 * The artwork is replaceable: see config/brand.ts.
 */
export function HomeHero() {
  const business = useBusinessInfo();
  const whatsapp = getWhatsappNumber(business);
  const phone = getPrimaryPhone(business);

  return (
    <section className="relative overflow-hidden bg-brand-950 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(56rem_36rem_at_82%_8%,rgb(44_64_147/0.45),transparent_70%)]"
      />
      <Container className="relative grid items-center gap-12 pt-12 pb-28 sm:pt-16 sm:pb-32 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:pt-20 lg:pb-36">
        <div className="animate-fade-in">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium tracking-wide text-brand-100">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-signal-400" />
            Kondapur · Hafeezpet · Hyderabad
          </p>

          <h1 className="mt-6 font-display text-[2.6rem] leading-[1.04] font-semibold tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]">
            Learn to drive.
            <br />
            Drive with <span className="text-accent-400">confidence.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">
            Professional driving training in Kondapur and Hafeezpet, with convenient house pickup
            and drop options.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to="/book" className={buttonStyles({ variant: "accent", size: "lg" })}>
              Book your lesson
              <ArrowRight aria-hidden="true" className="size-4" />
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
          </div>

          {phone && (
            <p className="mt-6 flex items-center gap-2 text-sm text-brand-200">
              <Phone aria-hidden="true" className="size-4" />
              Prefer to talk?
              <a
                href={telHref(phone)}
                className="font-semibold text-white underline-offset-4 hover:underline"
              >
                Call {formatPhone(phone)}
              </a>
            </p>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          {/* A yellow offset frame: the small road-sign accent. */}
          <div
            aria-hidden="true"
            className="absolute -inset-2 translate-x-3 translate-y-3 rounded-[2rem] border-2 border-signal-400/70"
          />
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-brand-900 shadow-overlay ring-1 ring-white/15 sm:aspect-[4/3] lg:aspect-[15/16]">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
}
