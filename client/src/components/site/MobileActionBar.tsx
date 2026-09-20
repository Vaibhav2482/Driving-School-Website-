import { MessageCircle, Phone } from "lucide-react";
import { Link, useLocation } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";

/**
 * Sticky bottom bar on phones: Call, WhatsApp and Book are always one thumb-tap away. Hidden from
 * 768px up (the header carries these actions there) and on the enquiry page, where it would cover
 * the form's submit button.
 */
export function MobileActionBar() {
  const { pathname } = useLocation();
  const business = useBusinessInfo();
  const phone = getPrimaryPhone(business);
  const whatsapp = getWhatsappNumber(business);

  if (pathname.startsWith("/book")) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-3 gap-2 p-2.5">
        {phone && (
          <a href={telHref(phone)} className={buttonStyles({ variant: "secondary", size: "md" })}>
            <Phone aria-hidden="true" className="size-4" />
            Call
          </a>
        )}
        {whatsapp && (
          <a
            href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: "primary", size: "md" })}
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            WhatsApp
          </a>
        )}
        <Link to="/book" className={buttonStyles({ variant: "accent", size: "md" })}>
          Book
        </Link>
      </div>
    </div>
  );
}
