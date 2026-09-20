import { House, MapPin, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { useBusinessInfo } from "@/features/public/hooks";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

interface TrustItem {
  icon: LucideIcon;
  title: string;
  text: string;
}

/**
 * A concise strip of confirmed facts, straight after the hero. No numbers, ratings or statistics.
 * The recognition line comes from the owner-managed settings and disappears if the owner removes it.
 */
export function TrustStrip() {
  const { recognition } = useBusinessInfo();

  const items: TrustItem[] = [
    ...(recognition
      ? [{ icon: ShieldCheck, title: "Government recognised", text: recognition }]
      : []),
    { icon: Users, title: "Ladies & Gents", text: "Driving training for everyone" },
    { icon: House, title: "House pickup & drop", text: "Convenient lessons, from home" },
    { icon: MapPin, title: "Two branches", text: "Kondapur & Hafeezpet" },
  ];

  return (
    <div className="relative z-10 -mt-8 sm:-mt-10">
      <Container>
        <Reveal>
          <ul className="grid divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-lift sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
            {items.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-4 p-5 sm:p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-[15px] leading-tight font-semibold text-ink">
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </div>
  );
}
