import { MapPin, Navigation, Phone } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { FALLBACK_BRANCH_NAMES } from "@/config/business-defaults";
import { getPrimaryPhone } from "@/features/public/business";
import { useBranches, useBusinessInfo } from "@/features/public/hooks";
import type { PublicBranch } from "@/features/public/types";
import { cn } from "@/lib/cn";
import { directionsHref, formatPhone, telHref } from "@/lib/contact";
import { CardGridSkeleton } from "./QueryStates";
import { Reveal } from "./Reveal";

function BranchCard({
  branch,
  fallbackPhone,
}: {
  branch: PublicBranch;
  fallbackPhone: string | null;
}) {
  const directions = directionsHref({ mapUrl: branch.mapUrl, address: branch.address });
  const phone = branch.phone ?? fallbackPhone;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-brand-900 text-white">
          <MapPin aria-hidden="true" className="size-5" />
        </span>
        <h3 className="font-display text-xl font-semibold text-ink">{branch.name}</h3>
      </div>

      {branch.address ? (
        <address className="mt-5 leading-relaxed whitespace-pre-line text-ink not-italic">
          {branch.address}
        </address>
      ) : (
        <p className="mt-5 text-muted">
          Address coming soon. Call us and we&apos;ll guide you to the branch.
        </p>
      )}

      {phone && (
        <a
          href={telHref(phone)}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-800 hover:text-accent-600"
        >
          <Phone aria-hidden="true" className="size-4" />
          {formatPhone(phone)}
        </a>
      )}

      <div className="mt-auto pt-6">
        {directions ? (
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            <Navigation aria-hidden="true" className="size-4" />
            Get directions
            <span className="sr-only"> to the {branch.name} branch (opens in a new tab)</span>
          </a>
        ) : (
          phone && (
            <a href={telHref(phone)} className={buttonStyles({ variant: "secondary", size: "md" })}>
              <Phone aria-hidden="true" className="size-4" />
              Call for directions
            </a>
          )
        )}
      </div>
    </article>
  );
}

/**
 * Branch cards from `GET /public/branches`. A branch with no address yet (Hafeezpet) is shown honestly
 * without one, and gains its address and directions automatically once the owner adds them.
 * If the API is unreachable, the two confirmed branch names are shown so the section is never empty.
 */
export function BranchesSection({ className }: { className?: string }) {
  const { data, isPending } = useBranches();
  const business = useBusinessInfo();
  const fallbackPhone = getPrimaryPhone(business);

  if (isPending) return <CardGridSkeleton count={2} className={cn("lg:grid-cols-2", className)} />;

  const branches: PublicBranch[] =
    data && data.length > 0
      ? data
      : FALLBACK_BRANCH_NAMES.map((name) => ({
          name,
          slug: name.toLowerCase(),
          // The confirmed card address belongs to the Kondapur branch.
          address: name === "Kondapur" ? business.addressLines.join("\n") : null,
          phone: null,
          mapUrl: null,
        }));

  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)}>
      {branches.map((branch, index) => (
        <Reveal key={branch.slug} delay={index * 80} className="h-full">
          <BranchCard branch={branch} fallbackPhone={fallbackPhone} />
        </Reveal>
      ))}
    </div>
  );
}
