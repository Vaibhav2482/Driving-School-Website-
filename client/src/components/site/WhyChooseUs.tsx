import {
  FileCheck2,
  HeartHandshake,
  House,
  MapPin,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
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

export function WhyChooseUs() {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {REASONS.map(({ icon: Icon, title, text }, index) => (
        <li key={title}>
          <Reveal delay={(index % 3) * 70} className="h-full">
            <div className="group flex h-full gap-4 rounded-2xl border border-line bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift sm:block sm:p-7">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-900 text-white transition-colors group-hover:bg-accent-600 sm:size-12">
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold text-ink sm:mt-5">{title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted sm:mt-2">{text}</p>
              </div>
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
