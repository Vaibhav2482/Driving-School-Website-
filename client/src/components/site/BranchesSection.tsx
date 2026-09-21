import { MapPin, Navigation, Phone } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { getPrimaryPhone } from "@/features/public/business";
import { useBranches, useBusinessInfo } from "@/features/public/hooks";
import type { PublicBranch } from "@/features/public/types";
import { cn } from "@/lib/cn";
import { directionsHref, formatPhone, telHref } from "@/lib/contact";
import { Reveal } from "./Reveal";

function BranchRow({
  branch,
  fallbackPhone,
}: {
  branch: PublicBranch;
  fallbackPhone: string | null;
}) {
  const directions = directionsHref({ mapUrl: branch.mapUrl, address: branch.address });
  const phone = branch.phone ?? fallbackPhone;

  return (
    <article className="grid gap-x-5 border-t border-white/15 py-8 sm:grid-cols-[auto_1fr]">
      <span
        aria-hidden="true"
        className="mb-3 grid h-10 w-12 place-items-center bg-accent-500 text-white [clip-path:polygon(22%_0,100%_0,78%_100%,0_100%)] sm:mb-0"
      >
        <MapPin className="size-5" />
      </span>

      <div>
        <h3 className="font-display text-4xl leading-none font-extrabold text-white">
          {branch.name}
        </h3>

        {branch.address ? (
          <address className="mt-4 leading-relaxed whitespace-pre-line text-sand-200 not-italic">
            {branch.address}
          </address>
        ) : (
          <p className="mt-4 leading-relaxed text-sand-400">
            Please call us for this branch&apos;s address and directions.
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
          {phone && (
            <a
              href={telHref(phone)}
              className="inline-flex items-center gap-2 font-semibold text-white hover:text-accent-300"
            >
              <Phone aria-hidden="true" className="size-4 text-accent-400" />
              {formatPhone(phone)}
            </a>
          )}
          {directions ? (
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonStyles({ variant: "inverse", size: "sm" })}
            >
              <Navigation aria-hidden="true" className="size-4" />
              Get directions
              <span className="sr-only"> to the {branch.name} branch (opens in a new tab)</span>
            </a>
          ) : (
            phone && (
              <a href={telHref(phone)} className={buttonStyles({ variant: "inverse", size: "sm" })}>
                <Phone aria-hidden="true" className="size-4" />
                Call for directions
              </a>
            )
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * The branches as a clean list on the dark contact band. A branch with no address yet (Hafeezpet) is shown honestly
 * without one, and gains its address and directions as soon as it is added to `features/public/content.ts`.
 */
export function BranchesSection({ className }: { className?: string }) {
  const { data: branches } = useBranches();
  const business = useBusinessInfo();
  const fallbackPhone = getPrimaryPhone(business);

  return (
    <div className={cn("border-b border-white/15", className)}>
      {branches.map((branch, index) => (
        <Reveal key={branch.slug} delay={index * 80}>
          <BranchRow branch={branch} fallbackPhone={fallbackPhone} />
        </Reveal>
      ))}
    </div>
  );
}
