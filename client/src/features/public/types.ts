/** Shapes of the website content (see content.ts). */

export type VehicleType = "CAR" | "TWO_WHEELER" | "OTHER";
export type TimeWindow = "MORNING" | "AFTERNOON" | "EVENING";

export interface PublicPackage {
  name: string;
  slug: string;
  description: string | null;
  /** Integer paise: 500000 = ₹5,000. */
  pricePaise: number;
  lessonCount: number;
  lessonDurationMinutes: number;
  vehicleType: VehicleType;
  validityDays: number | null;
  features: string[];
}

export interface PublicBranch {
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  mapUrl: string | null;
}

export interface PublicRtaService {
  name: string;
  slug: string;
  description: string | null;
  pricePaise: number | null;
  requiredDocuments: string[];
}

export interface PublicReview {
  authorName: string;
  /** 1 to 5 */
  rating: number;
  body: string;
}
