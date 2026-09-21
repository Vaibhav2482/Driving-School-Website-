import { BUSINESS_DEFAULTS, type BusinessInfo } from "@/config/business-defaults";
import type { PublicBranch, PublicPackage, PublicReview, PublicRtaService } from "./types";

/**
 * EVERYTHING the website shows about the business lives here. There is no database and no API: to change
 * the site, edit this file and redeploy.
 *
 * Only facts the client has confirmed are filled in (the business card). Anything not confirmed is left
 * empty on purpose, and the page sections that depend on it hide themselves (or show a "contact us" prompt)
 * instead of inventing content. To add them, fill the arrays below:
 *
 *  - `packages`     training plans with prices and lesson counts   (none confirmed yet)
 *  - `rtaServices`  named RTA services, documents and fees         (none confirmed yet)
 *  - `reviews`      real learner reviews, with permission          (none yet)
 *  - branch `address` / `phone` / `mapUrl` for Hafeezpet           (address not confirmed yet)
 *  - `business.workingHours` and `business.email`                  (not confirmed yet)
 */
export interface SiteContent {
  business: BusinessInfo;
  branches: PublicBranch[];
  packages: PublicPackage[];
  rtaServices: PublicRtaService[];
  reviews: PublicReview[];
}

export const SITE_CONTENT: SiteContent = {
  business: BUSINESS_DEFAULTS,
  branches: [
    {
      name: "Kondapur",
      slug: "kondapur",
      // The address printed on the business card belongs to the Kondapur branch.
      address: BUSINESS_DEFAULTS.addressLines.join("\n"),
      phone: null,
      mapUrl: null,
    },
    // Hafeezpet is a confirmed branch; its address has not been supplied yet.
    { name: "Hafeezpet", slug: "hafeezpet", address: null, phone: null, mapUrl: null },
  ],
  packages: [],
  rtaServices: [],
  reviews: [],
};

let current: SiteContent = SITE_CONTENT;

/** The content the site renders. */
export function getContent(): SiteContent {
  return current;
}

/** Test helper: render the site with different content. Never called by the app. */
export function setContentForTests(next: Partial<SiteContent>): void {
  current = { ...SITE_CONTENT, ...next };
}

/** Test helper: back to the real content. */
export function resetContentForTests(): void {
  current = SITE_CONTENT;
}
