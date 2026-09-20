import { formatInr } from "@/lib/format";
import type { PublicPackage, VehicleType } from "./types";

const VEHICLE_LABELS: Record<VehicleType, string> = {
  CAR: "Car",
  TWO_WHEELER: "Two-wheeler",
  OTHER: "Other vehicle",
};

export const vehicleTypeLabel = (type: VehicleType): string => VEHICLE_LABELS[type];

export const formatLessons = (count: number): string =>
  `${count} ${count === 1 ? "lesson" : "lessons"}`;

export const formatLessonDuration = (minutes: number): string => `${minutes} min`;

/** "90 days", "3 months", "1 year". Null means the plan does not expire. */
export function formatValidity(days: number | null): string | null {
  if (days === null) return null;
  if (days % 365 === 0) return `${days / 365} ${days === 365 ? "year" : "years"}`;
  if (days % 30 === 0 && days >= 60) return `${days / 30} months`;
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/**
 * A ₹0 price almost certainly means "not set yet", so it is shown as "Price on request" rather than
 * advertising a free plan.
 */
export const formatPackagePrice = (pkg: Pick<PublicPackage, "pricePaise">): string | null =>
  pkg.pricePaise > 0 ? formatInr(pkg.pricePaise) : null;
