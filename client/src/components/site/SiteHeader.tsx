import { MessageCircle, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { mainNav } from "@/config/public-nav";
import { SITE_NAME } from "@/config/site";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { cn } from "@/lib/cn";
import { telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";
import { Container } from "./Container";
import { Logo } from "./Logo";

export function SiteHeader() {
  const { pathname } = useLocation();
  // The menu is "open" only on the page it was opened on, so navigating closes it without an effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const menuOpen = openedAt === pathname;
  const setMenuOpen = (open: boolean) => setOpenedAt(open ? pathname : null);
  const business = useBusinessInfo();
  const whatsapp = getWhatsappNumber(business);
  const phone = getPrimaryPhone(business);

  // Escape closes the menu, and the page behind it stops scrolling while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenedAt(null);
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <Container className="flex h-16 items-center gap-4 lg:h-[72px]">
        <Link to="/" aria-label={`${SITE_NAME}, home`} className="rounded-control">
          <Logo />
        </Link>

        <nav aria-label="Main" className="ml-8 hidden items-center gap-1 lg:flex">
          {mainNav.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "relative rounded-control px-3 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-[15px] after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent-600 after:transition-transform after:content-['']",
                  isActive
                    ? "text-brand-900 after:scale-x-100"
                    : "text-sand-700 hover:text-brand-900 hover:after:scale-x-100",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {whatsapp && (
            <a
              href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: "secondary", size: "sm" })}
              aria-label="Chat with us on WhatsApp"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              <span className="hidden xl:inline">WhatsApp</span>
            </a>
          )}
          <Link to="/book" className={buttonStyles({ variant: "accent", size: "sm" })}>
            Book a lesson
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          {phone && (
            <a
              href={telHref(phone)}
              aria-label="Call us"
              className="grid size-11 place-items-center rounded-control text-brand-900 hover:bg-sand-100"
            >
              <Phone aria-hidden="true" className="size-5" />
            </a>
          )}
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid size-11 place-items-center rounded-control text-brand-900 hover:bg-sand-100"
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

      {menuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-16 bottom-0 z-30 overflow-y-auto overscroll-contain bg-canvas lg:hidden"
        >
          <Container className="animate-fade-in py-4 pb-10">
            <nav aria-label="Mobile">
              <ul className="divide-y divide-line">
                {mainNav.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center justify-between py-4 font-display text-xl font-semibold",
                          isActive ? "text-accent-600" : "text-brand-900",
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6 grid gap-3">
              <Link
                to="/book"
                className={buttonStyles({ variant: "accent", size: "lg", fullWidth: true })}
              >
                Book a lesson
              </Link>
              {whatsapp && (
                <a
                  href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonStyles({ variant: "primary", size: "lg", fullWidth: true })}
                >
                  <MessageCircle aria-hidden="true" className="size-5" />
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
