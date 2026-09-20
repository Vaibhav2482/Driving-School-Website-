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

/** The learner's journey in five steps. Deliberately makes no promise about results or timelines. */
export function HowItWorks({ dark = false }: { dark?: boolean }) {
  return (
    <ol className="relative grid gap-8 lg:grid-cols-5 lg:gap-6">
      {/* Connector line, desktop only. */}
      <div
        aria-hidden="true"
        className={`absolute top-6 right-[10%] left-[10%] hidden h-px lg:block ${dark ? "bg-white/15" : "bg-line-strong"}`}
      />
      {STEPS.map((step, index) => (
        <li key={step.title} className="relative flex gap-5 lg:block">
          <Reveal delay={index * 80} className="flex gap-5 lg:block">
            <span
              className={`relative grid size-12 shrink-0 place-items-center rounded-full font-display text-base font-semibold ring-8 ${
                dark
                  ? "bg-accent-600 text-white ring-brand-950"
                  : "bg-brand-900 text-white ring-canvas"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="lg:mt-6">
              <h3
                className={`font-display text-lg font-semibold ${dark ? "text-white" : "text-ink"}`}
              >
                {step.title}
              </h3>
              <p className={`mt-2 leading-relaxed ${dark ? "text-brand-100" : "text-muted"}`}>
                {step.text}
              </p>
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
