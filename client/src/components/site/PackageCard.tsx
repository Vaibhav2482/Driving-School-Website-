import { CalendarDays, Car, Check, Clock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/button-styles";
import { sectionHref } from "@/config/public-nav";
import {
  formatLessonDuration,
  formatLessons,
  formatPackagePrice,
  formatValidity,
  vehicleTypeLabel,
} from "@/features/public/labels";
import type { PublicPackage } from "@/features/public/types";

const MAX_FEATURES_ON_CARD = 4;

/** One training plan. Everything shown comes from the API; nothing is hard-coded. */
export function PackageCard({ pkg }: { pkg: PublicPackage }) {
  const price = formatPackagePrice(pkg);
  const validity = formatValidity(pkg.validityDays);
  const shownFeatures = pkg.features.slice(0, MAX_FEATURES_ON_CARD);
  const hiddenCount = pkg.features.length - shownFeatures.length;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden border-x border-t-4 border-b border-line border-t-accent-500 bg-surface p-7 transition duration-300 [clip-path:polygon(0_0,100%_0,100%_calc(100%-1.5rem),calc(100%-1.5rem)_100%,0_100%)] hover:-translate-y-1.5 hover:border-accent-300 hover:shadow-lift sm:p-8">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-300 via-accent-500 to-accent-300"
      />
      <Badge tone="brand" className="self-start">
        <Car aria-hidden="true" className="size-3.5" />
        {vehicleTypeLabel(pkg.vehicleType)}
      </Badge>

      <h3 className="mt-6 font-display text-2xl leading-snug font-semibold text-ink">{pkg.name}</h3>
      {pkg.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{pkg.description}</p>
      )}

      <div className="mt-7 border-y border-line py-6">
        {price ? (
          <p className="font-display text-4xl font-semibold tracking-tight text-brand-950">
            {price}
          </p>
        ) : (
          <p className="font-display text-2xl font-semibold text-brand-950">Price on request</p>
        )}
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Layers aria-hidden="true" className="size-4 text-accent-600" />
            <dt className="sr-only">Lessons</dt>
            <dd>{formatLessons(pkg.lessonCount)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4 text-accent-600" />
            <dt className="sr-only">Lesson length</dt>
            <dd>{formatLessonDuration(pkg.lessonDurationMinutes)} each</dd>
          </div>
          {validity && (
            <div className="flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4 text-accent-600" />
              <dt className="sr-only">Valid for</dt>
              <dd>{validity} validity</dd>
            </div>
          )}
        </dl>
      </div>

      {shownFeatures.length > 0 && (
        <ul className="mt-5 space-y-2.5 text-sm">
          {shownFeatures.map((feature) => (
            <li key={feature} className="flex gap-2.5">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-600" />
              <span>{feature}</span>
            </li>
          ))}
          {hiddenCount > 0 && <li className="pl-6.5 text-muted">+ {hiddenCount} more included</li>}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
        <a
          href={sectionHref("contact")}
          className={buttonStyles({ variant: "accent", size: "md" })}
        >
          Enquire about this plan
        </a>
      </div>
    </article>
  );
}
