import { CalendarCheck, GraduationCap, MapPin, ShieldCheck, type LucideIcon } from "lucide-react";
import { useBusinessInfo } from "@/features/public/hooks";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

interface TrustItem {
  icon: LucideIcon;
  title: string;
  text: string;
}

/**
 * A concise ledger of confirmed facts directly under the hero, on black with fine gold rules. No numbers,
 * ratings or statistics. The recognition line comes from the business details and disappears if it is removed.
 */
export function TrustStrip() {
  const { recognition } = useBusinessInfo();

  const items: TrustItem[] = [
    ...(recognition
      ? [{ icon: ShieldCheck, title: "Government recognised", text: recognition }]
      : []),
    { icon: MapPin, title: "Two branches", text: "Kondapur & Hafeezpet" },
    { icon: CalendarCheck, title: "Book your way", text: "Call, WhatsApp or send an enquiry" },
    { icon: GraduationCap, title: "Hands-on lessons", text: "Real road practice, step by step" },
  ];

  return (
    <div className="relative border-y border-accent-500/25 bg-brand-950 text-white">
      <Container>
        <Reveal>
          <ul className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 lg:auto-cols-fr lg:grid-flow-col lg:divide-x">
            {items.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-4 py-7 sm:px-7 lg:first:pl-0">
                <Icon aria-hidden="true" className="size-7 shrink-0 text-accent-400" />
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-snug text-sand-300">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </div>
  );
}
