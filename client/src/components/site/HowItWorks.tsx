import { Flag } from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  { title: "Choose your training", text: "Look through our plans, or ask us which one suits you." },
  {
    title: "Book your lesson",
    text: "Send an enquiry, call, or message us on WhatsApp and tell us what works for you.",
  },
  {
    title: "Meet your instructor",
    text: "We'll confirm your schedule and introduce you to the instructor who will guide you.",
  },
  {
    title: "Learn on the road",
    text: "Practise real driving with hands-on guidance at every lesson.",
  },
  {
    title: "Build confidence",
    text: "Lesson by lesson, you grow more comfortable and in control behind the wheel.",
  },
] as const;

/**
 * The learner's journey in five steps, drawn as a road: slanted red markers joined by a dashed centre line, ending
 * at a chequered-flag finish. Deliberately makes no promise about results or timelines.
 */
export function HowItWorks({ dark = false }: { dark?: boolean }) {
  return (
    <ol className="relative grid gap-12 lg:grid-cols-5 lg:gap-7">
      {/* The road: a dashed line behind the markers, desktop only. */}
      <div
        aria-hidden="true"
        className={`absolute top-7 right-[10%] left-[8%] hidden border-t-[3px] border-dashed lg:block ${dark ? "border-white/25" : "border-sand-400"}`}
      />
      {STEPS.map((step, index) => {
        const last = index === STEPS.length - 1;
        return (
          <li key={step.title} className="relative flex gap-6 lg:block">
            <Reveal delay={index * 80} className="flex gap-6 lg:block">
              <span
                className={`relative grid h-14 w-[4.5rem] shrink-0 place-items-center font-display text-3xl font-extrabold [clip-path:polygon(18%_0,100%_0,82%_100%,0_100%)] ${
                  last ? "bg-brand-950 text-white" : "bg-accent-500 text-white"
                }`}
              >
                {last ? (
                  <Flag aria-hidden="true" className="size-6" />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
                {last && <span className="sr-only">05</span>}
              </span>
              <div className="lg:mt-8">
                <h3
                  className={`font-display text-2xl font-extrabold ${dark ? "text-white" : "text-brand-950"}`}
                >
                  {step.title}
                </h3>
                <p className={`mt-2 leading-relaxed ${dark ? "text-brand-100" : "text-muted"}`}>
                  {step.text}
                </p>
              </div>
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
