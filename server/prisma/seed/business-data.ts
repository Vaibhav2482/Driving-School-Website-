/**
 * Business facts the client has CONFIRMED (printed on their business card and repeated by the
 * project owner). This is the ONLY place business data is hard-coded, and it is only used to
 * bootstrap the database: from then on the owner edits everything in the admin panel and the
 * public website reads it from the API.
 *
 * Do NOT add anything here that the client has not confirmed. Unknown values are `null` so the
 * owner can fill them in later. Not confirmed yet: email, working hours, Hafeezpet address,
 * prices, RTA service list, fleet and instructor details, any statistics or reviews.
 */

export interface SettingSeed {
  key: string;
  /** JSON value; `null` means "not provided yet". */
  value: unknown;
  isPublic: boolean;
  description: string;
}

/**
 * The card address belongs to the Kondapur branch (confirmed by the project owner in Phase 2).
 * The Hafeezpet address is not known yet, so it stays empty; the website simply shows no address
 * for it until the owner adds one in the admin panel.
 */
const CARD_ADDRESS_LINES = [
  "H.No. 2-40/8/45",
  "Kondapur Road, Khanamet",
  "Near Aditya Sunshine, Hanuman Nagar",
  "Hyderabad-84",
] as const;

export const BRANCHES = [
  { name: "Kondapur", slug: "kondapur", displayOrder: 1, address: CARD_ADDRESS_LINES.join("\n") },
  { name: "Hafeezpet", slug: "hafeezpet", displayOrder: 2 },
] as const;

/** Business-level address setting, exactly as printed on the business card. */
export const SETTINGS: SettingSeed[] = [
  {
    key: "business.name",
    value: "Sri Sai Balaji Driving School",
    isPublic: true,
    description: "Trading name shown on the website and in messages.",
  },
  {
    key: "business.proprietor",
    value: "P. Mahesh",
    isPublic: true,
    description: "Proprietor name as printed on the business card.",
  },
  {
    key: "business.recognition",
    value: "Recognised by Govt. of Telangana",
    isPublic: true,
    description:
      "Recognition statement as printed on the business card. Confirm the supporting registration/certificate before featuring it prominently.",
  },
  {
    key: "business.confirmedServices",
    value: [
      "Ladies & Gents driving training",
      "House pickup & dropping",
      "RTA guidance and services",
    ],
    isPublic: true,
    description: "Services confirmed on the business card.",
  },
  {
    key: "business.phones",
    // E.164 format; India (+91). The first number is also the WhatsApp number on the card.
    value: [
      { number: "+919666146913", whatsapp: true },
      { number: "+919000574542", whatsapp: false },
      { number: "+919676617132", whatsapp: false },
    ],
    isPublic: true,
    description:
      "Contact numbers. `whatsapp: true` marks the WhatsApp number (used for click-to-chat).",
  },
  {
    key: "business.address",
    value: {
      lines: [...CARD_ADDRESS_LINES],
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
    },
    isPublic: true,
    description: "Business address exactly as printed on the business card.",
  },
  {
    key: "business.email",
    value: null,
    isPublic: true,
    description: "Public contact email. Not provided yet.",
  },
  {
    key: "business.workingHours",
    value: null,
    isPublic: true,
    description: "Opening hours. Not provided yet.",
  },
];

/** Default skill list for lesson progress. Owner-editable; these are starting points only. */
export const DEFAULT_SKILLS = [
  "Vehicle Control",
  "Clutch Control",
  "Parking",
  "Traffic Handling",
  "Reverse",
  "Highway Driving",
  "Confidence",
] as const;
