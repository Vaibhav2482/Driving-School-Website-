import { WhatsAppIcon } from "@/components/common/WhatsAppIcon";
import { getWhatsappNumber } from "@/features/public/business";
import { useBusinessInfo } from "@/features/public/hooks";
import { whatsappHref, WHATSAPP_MESSAGES } from "@/lib/contact";

/**
 * A floating WhatsApp pill for tablets and desktops (phones have the bottom action bar). A soft pulse ring keeps it
 * noticeable without moving anything on the page. It appears only when there is a WhatsApp number.
 */
export function FloatingWhatsApp() {
  const whatsapp = getWhatsappNumber(useBusinessInfo());
  if (!whatsapp) return null;

  return (
    <a
      href={whatsappHref(whatsapp, WHATSAPP_MESSAGES.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed right-6 bottom-6 z-40 hidden items-center gap-3 rounded-full bg-[#25d366] py-2 pr-6 pl-2 text-brand-950 shadow-[0_14px_34px_-10px_rgb(37_211_102/0.7)] ring-1 ring-black/10 transition-all duration-300 hover:-translate-y-1 hover:bg-[#1fbd5a] md:inline-flex"
    >
      <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-brand-950 text-[#25d366]">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-[#25d366]/50 [animation-duration:2.4s]"
        />
        <WhatsAppIcon className="relative size-6" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-70">
          Chat with us
        </span>
        <span className="mt-1 font-display text-xl font-extrabold tracking-wide uppercase italic">
          WhatsApp
        </span>
      </span>
    </a>
  );
}
