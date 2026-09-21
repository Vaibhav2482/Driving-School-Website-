import {
  FileCheck2,
  HeartHandshake,
  House,
  MapPin,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

interface Reason {
  icon: LucideIcon;
  title: string;
  text: string;
}

/** Positioning statements based only on confirmed services. No statistics or superlatives. */
const REASONS: Reason[] = [
  {
    icon: ShieldCheck,
    title: "Professional driving training",
    text: "Practical, hands-on lessons that build real road confidence, one step at a time.",
  },
  {
    icon: Users,
    title: "Ladies & Gents",
    text: "Training for ladies and gents alike, at a pace that suits the learner.",
  },
  {
    icon: House,
    title: "House pickup & drop",
    text: "Pickup and dropping from your home makes it easier to fit lessons into your day.",
  },
  {
    icon: FileCheck2,
    title: "RTA guidance",
    text: "We guide you in all RTA works, so the paperwork never holds you back.",
  },
  {
    icon: MapPin,
    title: "Kondapur & Hafeezpet",
    text: "Two branches in Hyderabad. Train at the one that suits you.",
  },
  {
    icon: HeartHandshake,
    title: "Safe, practical learning",
    text: "Safety comes first. Lessons focus on the skills and habits that keep you safe on the road.",
  },
];

/** An editorial, numbered list. `columns={2}` when it sits beside a photograph. */
export function WhyChooseUs({ columns = 3 }: { columns?: 2 | 3 }) {
  return (
    <ul
      className={cn(
        "grid gap-x-12 gap-y-2",
        columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {REASONS.map(({ icon: Icon, title, text }, index) => (
        <li key={title}>
          <Reveal delay={(index % 2) * 90}>
            <div className="group relative border-t border-line-strong py-9 transition-colors duration-500">
              {/* A gold rule that draws across the top edge on hover. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -top-px h-px origin-left scale-x-0 bg-accent-500 transition-transform duration-700 group-hover:scale-x-100"
              />
              <div className="flex items-start justify-between gap-4">
                <span
                  aria-hidden="true"
                  className="text-outline-accent font-display text-6xl leading-none font-medium transition-all duration-500 group-hover:text-accent-500"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon
                  aria-hidden="true"
                  className="mt-1 size-6 text-accent-700 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
                />
              </div>
              <h3 className="mt-6 font-display text-2xl font-semibold text-ink">{title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{text}</p>
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
