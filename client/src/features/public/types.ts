/** Shapes returned by `/api/v1/public/*`. Mirrors the server allow-lists in catalog.service.ts. */

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

/** Flat `{ "business.name": …, … }` map of settings the owner marked public. */
export type PublicSettings = Record<string, unknown>;

/** Body of `POST /public/enquiries`. */
export interface EnquiryPayload {
  fullName: string;
  phone: string;
  packageSlug?: string;
  preferredBranchSlug?: string;
  preferredDate?: string;
  preferredTimeWindow?: TimeWindow;
  pickupAddress?: string;
  message?: string;
  consent: true;
  /** Honeypot: must stay empty. */
  website?: string;
}
