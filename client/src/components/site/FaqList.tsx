import { Plus } from "lucide-react";
import type { FaqItem } from "@/features/public/faq";

/**
 * Accessible accordion built on native `<details>`: keyboard and screen-reader friendly, no JS state. Each question is
 * its own white panel with a red bar that lights up while it is open.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group border-l-4 border-l-transparent bg-surface shadow-card transition-[border-color,box-shadow] duration-200 open:border-l-accent-500 open:shadow-lift hover:border-l-accent-300"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-display text-xl font-bold text-ink transition-colors marker:hidden hover:text-accent-700 sm:px-8 sm:py-6 sm:text-2xl [&::-webkit-details-marker]:hidden">
            {item.question}
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center bg-brand-950 text-white transition-colors [clip-path:polygon(22%_0,100%_0,78%_100%,0_100%)] group-open:bg-accent-500"
            >
              <Plus className="size-4 transition-transform duration-200 group-open:rotate-45" />
            </span>
          </summary>
          <div className="px-5 pb-7 text-lg leading-relaxed text-muted sm:px-8">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
