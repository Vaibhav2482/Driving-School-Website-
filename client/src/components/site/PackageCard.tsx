import { ArrowRight, CalendarDays, Car, Check, Clock, Layers } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/button-styles";
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
    <article className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift sm:p-7">
      <Badge tone="brand" className="self-start">
        <Car aria-hidden="true" className="size-3.5" />
        {vehicleTypeLabel(pkg.vehicleType)}
      </Badge>

      <h3 className="mt-5 font-display text-xl leading-snug font-semibold text-ink">{pkg.name}</h3>
      {pkg.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{pkg.description}</p>
      )}

      <div className="mt-6 border-y border-line py-5">
        {price ? (
          <p className="font-display text-3xl font-semibold tracking-tight text-brand-900">
            {price}
          </p>
        ) : (
          <p className="font-display text-xl font-semibold text-brand-900">Price on request</p>
        )}
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5">
            <Layers aria-hidden="true" className="size-4 text-brand-500" />
            <dt className="sr-only">Lessons</dt>
            <dd>{formatLessons(pkg.lessonCount)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4 text-brand-500" />
            <dt className="sr-only">Lesson length</dt>
            <dd>{formatLessonDuration(pkg.lessonDurationMinutes)} each</dd>
          </div>
          {validity && (
            <div className="flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4 text-brand-500" />
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
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success-700" />
              <span>{feature}</span>
            </li>
          ))}
          {hiddenCount > 0 && <li className="pl-6.5 text-muted">+ {hiddenCount} more included</li>}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
        <Link
          to={`/book?package=${encodeURIComponent(pkg.slug)}`}
          className={buttonStyles({ variant: "accent", size: "md" })}
        >
          Book this plan
        </Link>
        <Link
          to={`/packages/${pkg.slug}`}
          aria-label={`View details of ${pkg.name}`}
          className="inline-flex items-center gap-1.5 rounded-control px-1 py-2 text-sm font-semibold text-brand-800 hover:text-accent-600"
        >
          Details
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </article>
  );
}
