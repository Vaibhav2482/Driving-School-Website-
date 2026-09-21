import { ArrowRight, Menu, Phone, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { useEffect, useRef, useState } from "react";
import { buttonStyles } from "@/components/ui/button-styles";
import { sectionHref, sectionNav } from "@/config/public-nav";
import { SITE_NAME } from "@/config/site";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { cn } from "@/lib/cn";
import { formatPhone, telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { useActiveSection } from "./useActiveSection";

const SECTION_IDS = sectionNav.map((s) => s.id);

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);
  const active = useActiveSection(SECTION_IDS);
  const business = useBusinessInfo();
  const whatsapp = getWhatsappNumber(business);
  const phone = getPrimaryPhone(business);

  // Once the visitor scrolls, the header slims down (the utility bar folds away) so it takes less of the screen.
  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 48);
      // Reading progress: a thin gold line along the bottom edge of the header.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      progressRef.current?.style.setProperty("transform", `scaleX(${ratio})`);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Escape closes the menu, and the page behind it stops scrolling while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-brand-950 text-white transition-shadow duration-300",
        scrolled && "shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)]",
      )}
    >
      <div className="border-b border-accent-500/25 bg-brand-950/95 backdrop-blur">
        <Container className="flex h-[68px] items-center gap-4 lg:h-[76px]">
          <a
            href={sectionHref("home")}
            aria-label={`${SITE_NAME}, back to top`}
            className="rounded-control"
          >
            <Logo tone="light" />
          </a>

          <nav aria-label="Main" className="ml-8 hidden items-center gap-0.5 lg:flex">
            {sectionNav.map((link) => (
              <a
                key={link.id}
                href={sectionHref(link.id)}
                aria-current={active === link.id ? "true" : undefined}
                className={cn(
                  "relative rounded-control px-3 py-2 text-sm font-medium tracking-wide transition-colors after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-accent-400 after:transition-transform after:content-['']",
                  active === link.id
                    ? "text-accent-300 after:scale-x-100"
                    : "text-sand-200 hover:text-white hover:after:scale-x-100",
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2.5 lg:flex">
            {phone && (
              <a
                href={telHref(phone)}
                className="mr-2 hidden items-center gap-2 text-sm font-semibold text-white hover:text-accent-300 xl:flex"
              >
                <Phone aria-hidden="true" className="size-4 text-accent-400" />
                {formatPhone(phone)}
              </a>
            )}
            {whatsapp && (
              <a
                href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles({ variant: "whatsapp", size: "sm" })}
                aria-label="Chat with us on WhatsApp"
              >
                <WhatsAppIcon className="size-4" />
                <span>WhatsApp</span>
              </a>
            )}
            <a
              href={sectionHref("contact")}
              className={buttonStyles({ variant: "accent", size: "sm" })}
            >
              Book a lesson
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
          </div>

          <div className="ml-auto flex items-center gap-1 lg:hidden">
            {phone && (
              <a
                href={telHref(phone)}
                aria-label="Call us"
                className="grid size-11 place-items-center rounded-control text-white hover:bg-white/10"
              >
                <Phone aria-hidden="true" className="size-5" />
              </a>
            )}
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-11 place-items-center rounded-control text-white hover:bg-white/10"
            >
              {menuOpen ? (
                <X aria-hidden="true" className="size-6" />
              ) : (
                <Menu aria-hidden="true" className="size-6" />
              )}
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            </button>
          </div>
        </Container>
      </div>

      <span
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-accent-500 via-accent-300 to-accent-500"
      />

      {menuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-[68px] bottom-0 z-30 overflow-y-auto overscroll-contain bg-brand-950 lg:hidden"
        >
          <Container className="animate-fade-in py-6 pb-10">
            <nav aria-label="Mobile">
              <ul className="divide-y divide-white/10">
                {sectionNav.map((link) => (
                  <li key={link.id}>
                    <a
                      href={sectionHref(link.id)}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between py-4 font-display text-2xl font-semibold",
                        active === link.id ? "text-accent-300" : "text-white",
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-8 grid gap-3">
              <a
                href={sectionHref("contact")}
                onClick={() => setMenuOpen(false)}
                className={buttonStyles({ variant: "accent", size: "lg", fullWidth: true })}
              >
                Book a lesson
              </a>
              {whatsapp && (
                <a
                  href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ variant: "whatsapp", size: "lg", fullWidth: true })}
                >
                  <WhatsAppIcon className="size-5" />
                  WhatsApp us
                </a>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
