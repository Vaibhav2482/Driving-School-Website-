/**
 * FALLBACK ONLY. The source of truth for business details is the database (BusinessSetting), edited by
 * the owner and served by `GET /api/v1/public/settings`.
 *
 * These values are the facts printed on the client's business card. They are shown ONLY while the API
 * response is loading, unreachable, or missing a key, so the most important actions (call, WhatsApp,
 * find us) never disappear from the site. As soon as the API answers, its values win.
 *
 * Do not add anything the client has not confirmed. Unknown values are `null` / empty.
 */
export interface BusinessPhone {
  /** E.164, e.g. +919666146913 */
  number: string;
  whatsapp: boolean;
}

export interface BusinessInfo {
  name: string;
  proprietor: string | null;
  recognition: string | null;
  confirmedServices: string[];
  phones: BusinessPhone[];
  addressLines: string[];
  email: string | null;
  workingHours: string | null;
}

export const BUSINESS_DEFAULTS: BusinessInfo = {
  name: "Sri Sai Balaji Driving School",
  proprietor: "P. Mahesh",
  recognition: "Recognised by Govt. of Telangana",
  confirmedServices: [
    "Ladies & Gents driving training",
    "House pickup & dropping",
    "RTA guidance and services",
  ],
  // The first number is also the WhatsApp number shown on the card.
  phones: [
    { number: "+919666146913", whatsapp: true },
    { number: "+919000574542", whatsapp: false },
    { number: "+919676617132", whatsapp: false },
  ],
  addressLines: [
    "H.No. 2-40/8/45",
    "Kondapur Road, Khanamet",
    "Near Aditya Sunshine, Hanuman Nagar",
    "Hyderabad-84",
  ],
  email: null,
  workingHours: null,
};

/** Branch names are confirmed; used only to describe the business when the branch list is unavailable. */
export const FALLBACK_BRANCH_NAMES = ["Kondapur", "Hafeezpet"] as const;
