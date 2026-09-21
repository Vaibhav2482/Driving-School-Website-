import { ArrowRight, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { buttonStyles } from "@/components/ui/button-styles";
import { sectionHref } from "@/config/public-nav";
import { getPrimaryPhone, getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { telHref, whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";

/**
 * Sticky bottom bar on phones: Call, WhatsApp and Book are always one thumb-tap away. Hidden from
 * 768px up (the header carries these actions there).
 */
export function MobileActionBar() {
  const business = useBusinessInfo();
  const phone = getPrimaryPhone(business);
  const whatsapp = getWhatsappNumber(business);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-accent-500 bg-brand-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-[1fr_1.35fr_1.15fr] gap-2 p-2.5">
        {phone && (
          <a href={telHref(phone)} className={buttonStyles({ variant: "inverse", size: "md" })}>
            <Phone aria-hidden="true" className="size-4" />
            Call
          </a>
        )}
        {whatsapp && (
          <a
            href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: "whatsapp", size: "md" })}
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp
          </a>
        )}
        <a
          href={sectionHref("contact")}
          className={buttonStyles({ variant: "accent", size: "md" })}
        >
          Book
          <ArrowRight aria-hidden="true" className="size-4" />
        </a>
      </div>
    </div>
  );
}
