import type { BusinessInfo } from "@/config/business-defaults";
import { getContent } from "./content";
import type { PublicPackage } from "./types";

/**
 * Content accessors for the pages. The data is static (see `content.ts`), so these return immediately: there
 * is no loading or failure state.
 */
const ready = <T>(data: T) => ({ data });

export const usePackages = () => ready(getContent().packages);
export const useBranches = () => ready(getContent().branches);
export const useRtaServices = () => ready(getContent().rtaServices);
export const useReviews = () => ready(getContent().reviews);

/** One plan by its URL slug. `data` is `undefined` when there is no such plan. */
export const usePackage = (slug: string) =>
  ready<PublicPackage | undefined>(getContent().packages.find((p) => p.slug === slug));

/** Business details (name, phones, address, …), confirmed from the business card. */
export function useBusinessInfo(): BusinessInfo {
  return getContent().business;
}
