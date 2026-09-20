import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/features/public/faq";

/** Accessible accordion built on native `<details>`: keyboard and screen-reader friendly, no JS state. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 font-display text-base font-semibold text-ink transition-colors marker:hidden hover:bg-sand-50 sm:px-7 sm:text-lg [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-brand-500 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="px-5 pb-6 leading-relaxed text-muted sm:px-7">{item.answer}</div>
        </details>
      ))}
    </div>
  );
}
