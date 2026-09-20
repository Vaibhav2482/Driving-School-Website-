import { MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { FALLBACK_BRANCH_NAMES } from "@/config/business-defaults";
import { footerNav } from "@/config/public-nav";
import { getWhatsappNumber } from "@/features/public/business";
import { useBranches, useBusinessInfo } from "@/features/public/hooks";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { Container } from "./Container";
import { Logo } from "./Logo";

const headingClass = "font-display text-sm font-semibold tracking-wide text-white";
const linkClass = "text-brand-200 transition-colors hover:text-white";

export function SiteFooter() {
  const business = useBusinessInfo();
  const { data: branches } = useBranches();
  const whatsapp = getWhatsappNumber(business);

  const branchList =
    branches && branches.length > 0
      ? branches
      : FALLBACK_BRANCH_NAMES.map((name) => ({ name, slug: name.toLowerCase(), address: null }));

  return (
    <footer className="bg-brand-950 text-sm text-brand-200">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1.2fr] lg:gap-12">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-xs leading-relaxed">
            Driving training for ladies and gents in Kondapur and Hafeezpet, Hyderabad.
          </p>
          {business.recognition && (
            <p className="mt-4 inline-flex items-center gap-2 font-medium text-white">
              <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-signal-400" />
              {business.recognition}
            </p>
          )}
        </div>

        <nav aria-label="Footer">
          <h2 className={headingClass}>Explore</h2>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-1">
            {footerNav.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={linkClass}>
                  {link.label}
                </Link>
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
                  {phone.whatsapp && <span className="text-xs text-brand-300">(WhatsApp)</span>}
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
                  <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
                  Chat on WhatsApp
                </a>
              </li>
            )}
          </ul>
          <Link to="/book" className={`${buttonStyles({ variant: "accent", size: "sm" })} mt-5`}>
            Book a lesson
          </Link>
        </div>

        <div>
          <h2 className={headingClass}>Branches</h2>
          <ul className="mt-4 space-y-4">
            {branchList.map((branch) => (
              <li key={branch.slug} className="flex gap-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-signal-400" />
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

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-1 py-5 text-xs text-brand-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {business.name}
          </p>
          <p>RTA guidance · House pickup &amp; drop · Ladies &amp; Gents</p>
        </Container>
      </div>
    </footer>
  );
}
