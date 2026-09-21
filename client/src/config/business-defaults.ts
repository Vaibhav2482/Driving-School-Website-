/**
 * The business facts printed on the client's business card. This is the confirmed source for the website
 * (see features/public/content.ts). Do not add anything the client has not confirmed: unknown values are
 * `null` or empty, and the site simply leaves them out.
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
