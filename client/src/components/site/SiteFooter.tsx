import { MapPin, Phone, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { buttonStyles } from "@/components/ui/button-styles";
import { sectionHref, sectionNav } from "@/config/public-nav";
import { getWhatsappNumber } from "@/features/public/business";
import { useBranches, useBusinessInfo } from "@/features/public/hooks";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { Container } from "./Container";
import { Logo } from "./Logo";

const headingClass = "font-display text-lg font-semibold text-white";
const linkClass = "text-sand-300 transition-colors hover:text-accent-300";

export function SiteFooter() {
  const business = useBusinessInfo();
  const { data: branchList } = useBranches();
  const whatsapp = getWhatsappNumber(business);

  return (
    <footer className="grain relative overflow-hidden bg-brand-950 pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-sm text-sand-300 md:pb-0">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-500/70 to-transparent"
      />
      <Container className="relative z-[2] grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1.2fr] lg:gap-12">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-xs leading-relaxed">
            Driving training for ladies and gents in Kondapur and Hafeezpet, Hyderabad.
          </p>
          {business.recognition && (
            <p className="mt-4 inline-flex items-center gap-2 font-medium text-white">
              <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-accent-400" />
              {business.recognition}
            </p>
          )}
        </div>

        <nav aria-label="Footer">
          <h2 className={headingClass}>Explore</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-1">
            {sectionNav.map((link) => (
              <li key={link.id}>
                <a href={sectionHref(link.id)} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={headingClass}>Contact</h2>
          <ul className="mt-4 space-y-2.5">
            {business.phones.map((phone) => (
              <li key={phone.number}>
                <a
                  href={telHref(phone.number)}
                  className={`${linkClass} inline-flex items-center gap-2`}
                >
                  <Phone aria-hidden="true" className="size-4 shrink-0" />
                  {formatPhone(phone.number)}
                  {phone.whatsapp && <span className="text-xs text-sand-400">(WhatsApp)</span>}
                </a>
              </li>
            ))}
            {whatsapp && (
              <li>
                <a
                  href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${linkClass} inline-flex items-center gap-2`}
                >
                  <WhatsAppIcon className="size-4 shrink-0 text-[#25d366]" />
                  Chat on WhatsApp
                </a>
              </li>
            )}
          </ul>
          <a
            href={sectionHref("contact")}
            className={`${buttonStyles({ variant: "accent", size: "sm" })} mt-5`}
          >
            Book a lesson
          </a>
        </div>

        <div>
          <h2 className={headingClass}>Branches</h2>
          <ul className="mt-4 space-y-4">
            {branchList.map((branch) => (
              <li key={branch.slug} className="flex gap-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-400" />
                <div>
                  <p className="font-medium text-white">{branch.name}</p>
                  {branch.address && (
                    <p className="mt-0.5 leading-relaxed whitespace-pre-line">{branch.address}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* Oversized outlined wordmark: a quiet flourish to close the page. */}
      <p
        aria-hidden="true"
        className="text-outline-accent pointer-events-none px-4 pb-5 text-center font-display text-[15vw] leading-[0.9] font-extrabold whitespace-nowrap opacity-60 select-none [-webkit-text-stroke-color:rgb(229_37_27/0.45)]"
      >
        Sri Sai Balaji
      </p>

      <div className="relative z-[2] border-t border-white/10">
        <Container className="flex flex-col gap-1 pt-5 pb-5 text-xs text-sand-400 sm:flex-row sm:items-center sm:justify-between md:pb-20">
          <p>
            © {new Date().getFullYear()} {business.name}
          </p>
          <p>RTA guidance · House pickup &amp; drop · Ladies &amp; Gents</p>
        </Container>
      </div>
    </footer>
  );
}
