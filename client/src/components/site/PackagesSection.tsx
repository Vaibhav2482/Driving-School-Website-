import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import { Link } from "react-router";
import { buttonStyles } from "@/components/ui/button-styles";
import { usePackages } from "@/features/public/hooks";
import { PackageCard } from "./PackageCard";
import { CardGridSkeleton, LoadError } from "./QueryStates";
import { Reveal } from "./Reveal";

/** Shown when no package is active. We never display sample plans or prices. */
export function PackagesEmpty() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center sm:px-10">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand-50 text-brand-700">
        <MessageCircleQuestion aria-hidden="true" className="size-7" />
      </span>
      <h3 className="mt-5 font-display text-2xl font-semibold text-ink">
        Looking for the right training plan?
      </h3>
      <p className="mx-auto mt-3 max-w-md text-muted">Contact us and we&apos;ll help you choose.</p>
      <Link to="/contact" className={`${buttonStyles({ variant: "accent", size: "lg" })} mt-7`}>
        Get in touch
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </div>
  );
}

/**
 * The live list of training plans from `GET /public/packages`, with loading, error and empty states.
 * `limit` shows only the first N (the home page).
 */
export function PackagesSection({ limit }: { limit?: number }) {
  const { data, isPending, isError, refetch } = usePackages();

  if (isPending) return <CardGridSkeleton count={limit ?? 3} />;
  if (isError) return <LoadError what="our training plans" onRetry={() => void refetch()} />;
  if (data.length === 0) return <PackagesEmpty />;

  const shown = limit ? data.slice(0, limit) : data;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {shown.map((pkg, index) => (
        <Reveal key={pkg.slug} delay={index * 70} className="h-full">
          <PackageCard pkg={pkg} />
        </Reveal>
      ))}
    </div>
  );
}
