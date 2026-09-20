import { JsonLd } from "@/components/common/JsonLd";
import { env } from "@/config/env";
import { useBranches, useBusinessInfo } from "@/features/public/hooks";
import { buildDrivingSchoolJsonLd } from "@/features/public/structured-data";

/** Site-wide LocalBusiness structured data, from the owner-managed business details. */
export function BusinessJsonLd() {
  const business = useBusinessInfo();
  const { data: branches } = useBranches();
  return (
    <JsonLd
      data={buildDrivingSchoolJsonLd(business, {
        branchNames: branches?.map((branch) => branch.name),
        siteUrl: env.VITE_SITE_URL,
      })}
    />
  );
}
