import type { BusinessInfo } from "@/config/business-defaults";

/**
 * schema.org `DrivingSchool` (a LocalBusiness) built ONLY from real, owner-confirmed data.
 * Deliberately absent: aggregateRating, review counts, opening hours, price range and geo coordinates,
 * because none of them have been provided. Add them here once real values exist in the database.
 */
export function buildDrivingSchoolJsonLd(
  business: BusinessInfo,
  options: { branchNames?: string[]; siteUrl?: string } = {},
): Record<string, unknown> {
  const [streetLines, city] = [business.addressLines.slice(0, -1), business.addressLines.at(-1)];
  const telephone = business.phones[0]?.number;

  return {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    name: business.name,
    ...(options.siteUrl ? { url: options.siteUrl } : {}),
    ...(telephone ? { telephone } : {}),
    ...(business.email ? { email: business.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: streetLines.join(", ") || undefined,
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
      ...(city && !/^hyderabad/i.test(city) ? { name: city } : {}),
    },
    ...(options.branchNames && options.branchNames.length > 0
      ? {
          areaServed: options.branchNames.map((name) => ({
            "@type": "Place",
            name: `${name}, Hyderabad`,
          })),
        }
      : {}),
  };
}
